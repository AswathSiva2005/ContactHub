# Production Deployment Runbook

## 1. Atlas

Create a transaction-capable cluster, least-privilege `contactsync_app` user, network rule, backups, and alerts. Keep the SRV URI private.

## 2. Railway

Choose **Deploy from GitHub repo** and set **Root Directory** to `/backend`. Add:

```dotenv
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=contactsync
CORS_ORIGIN=contactsync://app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
MONGODB_CONNECT_RETRIES=10
MONGODB_CONNECT_RETRY_DELAY_MS=5000
APP_LATEST_VERSION=1.0.0
APP_MINIMUM_VERSION=1.0.0
APP_APK_DOWNLOAD_URL=https://github.com/OWNER/REPOSITORY/releases/download/v1.0.0/contactsync.apk
APP_RELEASE_NOTES=Initial production release.
```

Railway supplies `PORT`. Generate a public domain and verify `/api/v1/health`.

## 3. Bind and build the app

Replace every placeholder Railway domain in `frontend/eas.json`.

```powershell
cd backend
npm ci
npm run check
cd ..\frontend
npm ci
npm run check
npx expo config --type public
eas build --platform android --profile preview
```

Test registration, permission denial/settings recovery, import, offline queue, deletion, `contactsync://` deep linking, health status, and the update installer on a physical device.

## 4. Release

Build `production-apk`, upload it to a GitHub Release as `contactsync.apk`, set the final asset URL in Railway, redeploy, and send the APK plus the README installation instructions through WhatsApp.

## 5. Rollback

Railway can redeploy an earlier backend. For mobile rollback, build the corrected code with a higher `versionCode`; Android will not install a lower version code over an existing release.
