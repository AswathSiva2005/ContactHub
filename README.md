# ContactSync

ContactSync is an Expo Android app for importing student/parent contacts from spreadsheets and synchronizing metadata with an Express and MongoDB Atlas API.

## Setup

Requirements: Node.js 20+, npm 10+, MongoDB Atlas, an Expo account, and an Android device/emulator.

```powershell
cd backend; npm ci; Copy-Item .env.example .env; npm run dev
cd ..\frontend; npm ci; Copy-Item .env.example .env; npm start
```

Use `http://10.0.2.2:4000/api/v1` for an Android emulator. Never commit `.env` files.

## MongoDB and Render

Create an Atlas database user and allow Render outbound access. Create a Render Web Service from GitHub using `render.yaml`, or set root directory to `backend`, build command `npm ci && npm run build`, start command `npm start`, and health check `/api/v1/health`. Set `MONGODB_URI`, `MONGODB_DB_NAME`, `CORS_ORIGIN`, `APP_LATEST_VERSION`, `APP_MINIMUM_VERSION`, `APP_APK_DOWNLOAD_URL`, and `APP_RELEASE_NOTES` in Render. Render supplies `PORT` automatically. Use an HTTPS Render URL in `CORS_ORIGIN` and the mobile API URL.

## EAS APK builds

```powershell
npm install --global eas-cli
cd frontend
eas login
eas build:configure
npm run check
npm run build:apk
npm run build:aab
```

Replace the Render URL in `eas.json` before building. Keep the same package name and signing key for updates. APKs can be shared privately through WhatsApp. Android may require enabling **Install unknown apps** for WhatsApp or the file manager.

## Updates

`GET /api/v1/version` returns the latest version, minimum supported version, HTTPS APK URL, and release notes. The app checks this endpoint at startup and offers **Update** (opens the APK URL in the browser) or **Later**. Android installation remains user-confirmed; silent installation is not attempted.

## API

Base URL: `/api/v1`. Public endpoints are `/health` and `/version`; authentication endpoints are under `/auth`; batches and contacts require a bearer session token. MongoDB indexes enforce owner-scoped uniqueness and duplicate prevention.

## Checks and structure

```text
backend/src/{config,controllers,middleware,models,routes,utils}
frontend/{app,components,services,storage,types,utils}
```

Run `npm run check` in both `backend` and `frontend`. If Render health fails, check Atlas network access and environment variables. If the app cannot connect, rebuild with the final HTTPS Render URL. If an update is not shown, verify that `APP_LATEST_VERSION` is greater than the installed version and that the APK URL is public HTTPS.
