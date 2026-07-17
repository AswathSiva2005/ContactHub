# ContactSync

ContactSync is a production-oriented Expo/React Native application for importing student and parent contacts from Excel or CSV, storing synchronized metadata in MongoDB, and managing the resulting Android contacts. It includes phone-based accounts, per-user data isolation, offline reads, a durable ordered upload queue, automatic retry, light/dark themes, loading skeletons, global error recovery, and an Express REST API.

## Requirements

- Node.js 20+
- npm 10+
- MongoDB Atlas or MongoDB 7+
- Android Studio/SDK or Expo Go for local Android development
- An Expo account and EAS CLI for signed production Android builds

## Installation guide

```bash
git clone <repository-url>
cd ContactHub
cd backend
npm ci
copy .env.example .env
cd ..\frontend
npm ci
copy .env.example .env
```

Set `MONGODB_URI` in `backend/.env`. Set `EXPO_PUBLIC_API_URL` to:

- Android emulator: `http://10.0.2.2:4000/api/v1`
- Physical device: `http://<computer-lan-ip>:4000/api/v1`
- Production: `https://<api-domain>/api/v1`

Never commit `.env`. Use an HTTPS API and a least-privilege MongoDB user in production.

## Backend commands

Run from `backend/`.

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproducible dependency installation |
| `npm run dev` | Start API with TypeScript watch mode |
| `npm run typecheck` | Strict TypeScript validation |
| `npm run build` | Compile to `dist/` |
| `npm run check` | Type-check and build |
| `npm start` | Run the compiled server |
| `docker build -t contactsync-api .` | Build production container |
| `docker run --env-file .env -p 4000:4000 contactsync-api` | Run production container |

## Frontend commands

Run from `frontend/`.

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproducible dependency installation |
| `npm start` | Start Expo development server |
| `npm run android` | Open Android target |
| `npm run typecheck` | Strict TypeScript validation |
| `npm run lint` | Expo ESLint validation |
| `npm run check` | Type-check and lint |
| `npm run build:web` | Export optimized static web bundle |
| `npx eas-cli build --platform android --profile preview` | Internal APK |
| `npx eas-cli build --platform android --profile production` | Signed production AAB |

## Folder structure

```text
ContactHub/
├── backend/
│   ├── src/
│   │   ├── config/       # environment and MongoDB
│   │   ├── controllers/  # route handlers
│   │   ├── middleware/   # errors, 404s, request context
│   │   ├── models/       # Mongoose schemas and indexes
│   │   ├── routes/       # versioned REST routes
│   │   └── utils/        # pagination, regex, shutdown
│   ├── postman/          # API test collection
│   └── Dockerfile
├── frontend/
│   ├── app/              # Expo Router screens
│   ├── components/       # reusable UI, skeletons, boundaries
│   ├── constants/        # Material themes
│   ├── hooks/            # theme and sync state hooks
│   ├── services/         # API, import, contacts, sync queue
│   ├── storage/          # AsyncStorage repositories
│   ├── types/            # TypeScript domain contracts
│   └── utils/            # errors, names, dates
└── README.md
```

## API documentation

Base path: `/api/v1`. Successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "message": "...", "requestId": "..." } }`. Lists include `pagination`; `limit` defaults to 50 and is capped at 200.

Batch and contact endpoints require `Authorization: Bearer <session-token>`. Session tokens are returned only by registration/login, stored hashed in MongoDB, and expire after 30 days.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | API, database, and timestamp status |
| POST | `/auth/register` | Register with unique `phoneNumber` and `name` |
| POST | `/auth/login` | Log in with the registered `name` and `phoneNumber` |
| GET | `/auth/me` | Read the authenticated profile |
| POST | `/auth/logout` | Revoke the current session |
| POST | `/batches` | Create a batch |
| GET | `/batches` | List; supports `search`, `sort`, `userDeviceId`, `page`, `limit` |
| GET | `/batches/:batchId` | Read one batch |
| PATCH | `/batches/:batchId` | Rename a batch |
| DELETE | `/batches/:batchId` | Delete batch and its contacts |
| DELETE | `/batches` | Delete all batches and contacts |
| POST | `/contacts` | Create a contact pair in a batch |
| GET | `/contacts` | List/search; supports `batchId`, `search`, `sort`, `page`, `limit` |
| GET | `/contacts/:contactUuid` | Read one contact |
| PATCH | `/contacts/:contactUuid` | Update a contact pair |
| DELETE | `/contacts/:contactUuid` | Delete one contact pair |
| DELETE | `/contacts/selected` | Delete 1–200 UUIDs; body `{ "contactUuids": [] }` |

Create batch body:

```json
{
  "batchId": "uuid",
  "batchName": "Class 10 A",
  "academicYear": "2026-27",
  "userDeviceId": "device-uuid"
}
```

Create contact body:

```json
{
  "contactUuid": "uuid",
  "batchId": "uuid",
  "studentName": "Student",
  "parentName": "Parent",
  "studentNumber": "+919000000001",
  "parentNumber": "+919000000002",
  "rollNumber": "12",
  "studentPhoneContactId": "android-id",
  "parentPhoneContactId": "android-id"
}
```

Import `backend/postman/ContactSync-Phase-2.postman_collection.json` for an executable request collection.

## MongoDB collections

### `batches`

`batchId` (unique), `batchName`, `academicYear`, `createdDate`, `totalContacts`, `userDeviceId`, and owner `userId`. Indexes support owner/date and device/date listing.

### `contacts`

`contactUuid` (unique), student/parent names and normalized numbers, `rollNumber`, `batchId`, owner `userId`, Android contact IDs, and `createdDate`. Indexes support owner/batch/date, batch/roll, and text search. Batch contact counts are updated transactionally; Atlas deployments must support transactions.

### `users`

One document per registered account: display `name`, normalized internal `nameKey`, globally unique normalized `phoneNumber`, and timestamps.

### `sessions`

Opaque session-token hashes linked to `userId`, with `expiresAt`, `lastUsedAt`, and timestamps. A TTL index automatically removes expired sessions.

## Environment variables

### Backend

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `NODE_ENV` | No | `development` | Use `production` when deployed |
| `PORT` | No | `4000` | 1–65535 |
| `MONGODB_DB_NAME` | No | `contactsync` | Database name |
| `CORS_ORIGIN` | Production | `*` | Comma-separated exact origins; wildcard is rejected in production |
| `DNS_SERVERS` | No | empty | Comma-separated DNS override |

### Frontend

| Variable | Required | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Yes | Versioned API URL; must be HTTPS in production |

`EXPO_PUBLIC_*` values are embedded in the client bundle and must never contain secrets.

## Offline, sync, and retry behavior

The newest batch list and searchable contacts are cached on-device. Network/timeout/5xx failures during batch/contact uploads are stored in an ordered AsyncStorage queue. The app retries on launch, when returning to the foreground, every 30 seconds while active, or when the user taps **Retry**. Ordering ensures a queued batch is uploaded before its contacts. Non-retryable/conflicting operations are discarded so they cannot block later work; retryable operations are capped at eight attempts.

Caches and queued writes are cleared when the authenticated account changes. Every database query and mutation is scoped by the server-side session `userId`; clients cannot select or override another owner.

## Production build and deployment

Backend:

```bash
cd backend
npm ci
npm run check
docker build -t contactsync-api .
docker run --env-file .env -p 4000:4000 contactsync-api
```

Frontend Android:

```bash
cd frontend
npm ci
npm run check
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile production
```

Frontend web:

```bash
cd frontend
npm run build:web
```

Deploy `frontend/dist/` to static hosting with SPA fallback enabled. Before release, configure HTTPS, explicit CORS origins, MongoDB network access, database backups, centralized logs, uptime monitoring against `/api/v1/health`, and store privacy/data-deletion disclosures. Rotate any credential that has ever appeared in source control.

## Release verification

```bash
cd backend
npm run check
cd ..\frontend
npm run check
```

Then validate import, airplane-mode import/queued sync, app resume, duplicate handling, rename/edit/delete, light/dark/system themes, Android permission denial, and the production health endpoint on a real Android device.
#   C o n t a c t H u b  
 