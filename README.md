# ContactSync

ContactSync is an Expo/React Native Android app for teachers to import student and parent contacts from spreadsheets, synchronize metadata securely with a Railway-hosted Express API, and store data in MongoDB Atlas. Signed APK releases are distributed privately through WhatsApp, and the app checks the backend for future updates.

## Architecture

```text
Android device → ContactSync APK → Railway HTTPS API (/api/v1) → MongoDB Atlas
                     └──────────→ Android Contacts
```

## Requirements

- Node.js 20 or 22 and npm 10+
- GitHub, Railway, MongoDB Atlas, and Expo accounts
- EAS CLI and an Android 8+ test device

## Folder structure

```text
ContactHub/
├── .github/workflows/ci.yml
├── backend/
│   ├── src/{config,controllers,middleware,models,routes,utils}
│   ├── Dockerfile
│   ├── railway.json
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── assets/
│   ├── components/
│   ├── services/
│   ├── app.json
│   ├── eas.json
│   └── .env.example
├── DEPLOYMENT.md
└── LICENSE
```

## Local installation

```powershell
git clone <your-repository-url>
cd ContactHub\backend
npm ci
Copy-Item .env.example .env
cd ..\frontend
npm ci
Copy-Item .env.example .env
```

Use `http://10.0.2.2:4000/api/v1` for an Android emulator or the computer's LAN IP for a physical device.

```powershell
cd backend
npm run dev

# another terminal
cd frontend
npm start
```

## Environment variables

### Backend

| Variable | Required | Production value |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Railway sets it | Do not hard-code |
| `MONGODB_URI` | Yes | Atlas SRV connection string |
| `MONGODB_DB_NAME` | No | `contactsync` |
| `CORS_ORIGIN` | Yes | Exact web origins; `contactsync://app` if there is no web client |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` |
| `RATE_LIMIT_MAX` | No | `300` |
| `AUTH_RATE_LIMIT_MAX` | No | `20` |
| `MONGODB_CONNECT_RETRIES` | No | `10` |
| `MONGODB_CONNECT_RETRY_DELAY_MS` | No | `5000` |
| `APP_LATEST_VERSION` | Yes | For example `1.1.0` |
| `APP_MINIMUM_VERSION` | Yes | Oldest allowed app version |
| `APP_APK_DOWNLOAD_URL` | Yes | Public HTTPS APK URL |
| `APP_RELEASE_NOTES` | Yes | Short plain-text release notes |

The frontend uses only `EXPO_PUBLIC_API_URL`. It is embedded in the APK, must end in `/api/v1`, and must use HTTPS in production. Never put secrets in an `EXPO_PUBLIC_*` value.

## MongoDB Atlas setup

1. Create a cluster that supports transactions.
2. Create a dedicated user with read/write access only to `contactsync`.
3. Allow Railway's egress range. If a stable range is unavailable, use `0.0.0.0/0` only with a strong generated password, least privilege, TLS, and credential rotation.
4. Put the SRV URI in Railway as `MONGODB_URI`; URL-encode password special characters.
5. Enable backups and alerts.

The API creates indexes at startup. Unique owner-scoped indexes reject duplicate batch IDs/names, contact UUIDs, and phone numbers. Queries are scoped to the authenticated user.

## Railway deployment

Set the Railway root directory to `backend`. The repository includes `railway.json`, a non-root production Dockerfile, dynamic `PORT`, MongoDB retry, graceful shutdown, and `/api/v1/health`.

```powershell
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
railway domain
```

Set the variables from `backend/.env.example`, then verify:

```powershell
Invoke-RestMethod https://YOUR-DOMAIN.up.railway.app/api/v1/health
Invoke-RestMethod https://YOUR-DOMAIN.up.railway.app/api/version
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full runbook.

## EAS Android builds

Replace the placeholder Railway URL in `frontend/eas.json`, then:

```powershell
npm install --global eas-cli
cd frontend
eas login
eas build:configure
npm run check
npm run build:apk
```

- `preview`: internal test APK.
- `production-apk`: signed APK for WhatsApp.
- `production`: signed AAB for possible future store use.

Keep the EAS Android keystore safe. Every update must use the same signing key and a higher `android.versionCode`.

## Release and automatic update process

For release `1.1.0`:

1. Change `frontend/app.json` `version` to `1.1.0`.
2. Increase `android.versionCode` to `2`.
3. Run `npm run check` and `npm run build:apk`.
4. Create GitHub Release `v1.1.0` and upload the APK as `contactsync.apk`.
5. Set Railway `APP_LATEST_VERSION=1.1.0`, the exact HTTPS release asset URL, and release notes.
6. Redeploy Railway and test from the previous APK.
7. Raise `APP_MINIMUM_VERSION` only when older versions must be blocked.

At startup, the app calls `GET /api/v1/version`. Optional updates show **Update now** and **Later**. Versions below the minimum cannot dismiss the dialog. Android always requires the teacher to approve the system installer; silent APK replacement is not permitted.

## WhatsApp installation guide

1. Download `contactsync.apk` from WhatsApp.
2. Tap the downloaded file.
3. If blocked, open **Settings → Install unknown apps**, choose WhatsApp or the file manager, and enable **Allow from this source**.
4. Return, tap **Install**, and open ContactSync.
5. Allow Contacts access when prompted.
6. Turn off **Allow from this source** afterward.

For an update, tap **Update now** and confirm Android's **Update** prompt. App data remains because the package name and signing key stay unchanged. Do not uninstall first.

## API documentation

Base URL: `/api/v1`. Protected routes use `Authorization: Bearer <session-token>`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | API and database health |
| GET | `/version` | No | Version policy, APK URL, notes |
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Create session |
| GET/POST | `/batches` | Yes | List/create batches |
| GET/PATCH/DELETE | `/batches/:batchId` | Yes | Batch operations |
| GET/POST | `/contacts` | Yes | List/create contacts |
| GET/PATCH/DELETE | `/contacts/:contactUuid` | Yes | Contact operations |
| DELETE | `/contacts/selected` | Yes | Delete 1–200 contacts |

Success is `{ "success": true, "data": ... }`; errors are `{ "success": false, "error": { "message": "...", "requestId": "..." } }`. An executable Postman collection is in `backend/postman`.

## Security

- HTTPS-only production client configuration.
- Secrets remain in Railway and Atlas variables.
- Helmet, compression, explicit CORS, global/auth rate limits.
- JSON size limit, NoSQL operator sanitization, Mongoose validation.
- Hashed random session tokens, per-user isolation, TTL expiry.
- Request IDs, production-safe errors, retrying database startup, and graceful shutdown.

## GitHub setup

```powershell
git add .
git commit -m "Prepare ContactSync for production"
git branch -M main
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

Protect `main`, require CI, enable security alerts, and never commit `.env`, keystores, APKs, or database exports.

## Troubleshooting

- **Railway health fails:** confirm root directory `backend`, required variables, and Atlas network access.
- **Atlas auth fails:** URL-encode the password and check database-user permissions.
- **App cannot connect:** put the final HTTPS `/api/v1` URL in the EAS profile and rebuild.
- **APK will not install:** enable unknown-app permission, confirm storage, signing key, and increasing version code.
- **Installer does not open:** grant **Install unknown apps** to ContactSync and retry.
- **No update dialog:** inspect `/api/v1/version`; latest must exceed the installed semantic version.
- **Contacts denied:** use **ContactSync → Settings → Open Device Settings → Permissions → Contacts → Allow**.

## License

MIT — see [LICENSE](LICENSE).
