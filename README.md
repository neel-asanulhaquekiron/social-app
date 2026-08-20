# Mini Social Feed App

A social feed built with **Expo (SDK 57)** and a **Node/Express** API on top of **Supabase** (PostgreSQL + Auth + Realtime). Users post updates, like and comment on a shared feed, and receive push notifications through **Expo Push Notifications** (FCM on Android).

---

## Architecture

```
Expo app ──► Supabase Auth        (sign up / sign in / session refresh)
   │
   │  Authorization: Bearer <Supabase access token>
   ▼
Express API ──► Supabase (service-role key, bypasses RLS)
   │
   └─► Expo Push Service ──► FCM / APNs

Expo app ◄── Supabase Realtime    (postgres_changes, authenticated)
```

Two things are worth knowing up front:

- **The app authenticates directly with Supabase Auth.** The API never sees a password; it only _verifies_ the Supabase access token (ES256) against the project's JWKS endpoint. There are no `/auth` routes.
- **All data access goes through the API**, which uses the service-role key. The client touches Supabase directly only for Auth and Realtime, so row-level security is written for exactly that: read access for Realtime, and per-user rules for everything else.

---

## Project structure

```
social-app/
├── src/                     # Expo app
│   ├── app/                 # expo-router screens; (main) is the authed group
│   ├── components/          # Presentational components
│   ├── context/             # AuthContext (session + isReady)
│   ├── helpers/             # Dimensions, date formatting, zod schemas
│   ├── hooks/               # useFeed, useLike, useUnseenCount, useRealtimeFeed
│   ├── lib/                 # supabase client, query client, cache patching
│   ├── services/            # apiClient + one module per resource
│   ├── types/               # Shared API types
│   └── __tests__/           # jest-expo tests
├── server/                  # Express API
│   ├── app.js               # Builds the app (imported by tests)
│   ├── server.js            # Starts it
│   ├── config/              # Validated env, logger, Supabase clients
│   ├── controllers/         # Thin: unwrap the request, call a model
│   ├── middlewares/         # auth (JWKS), validate (zod), error handler
│   ├── models/              # All Supabase queries
│   ├── router/              # Route definitions
│   ├── utils/               # Result envelope, cursor pagination, asyncHandler
│   └── __tests__/           # jest + supertest
└── supabase/migrations/     # SQL migrations, applied in order
```

---

## Getting started

### Prerequisites

- Node 20+
- A Supabase project
- **A development build** — Expo Go cannot receive Android push notifications (removed in SDK 53), and this app uses native modules (`expo-secure-store`, `expo-notifications`).

### 1. Install

```bash
npm install
cd server && npm install && cd ..
```

### 2. Configure the app

```bash
cp .env.example .env
```

| Variable                        | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | `https://<project-ref>.supabase.co`             |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key                            |
| `EXPO_PUBLIC_API_BASE_URL`      | Base URL of the Express API (no trailing slash) |

`EXPO_PUBLIC_*` values are inlined at build time, so restart with `npx expo start -c` after changing them. The app fails fast at startup naming any variable that is missing.

### 3. Configure the server

```bash
cp server/.env.example server/.env
```

| Variable                    | Required | Purpose                                                     |
| --------------------------- | -------- | ----------------------------------------------------------- |
| `SUPABASE_URL`              | yes      | Same project URL                                            |
| `SUPABASE_SERVICE_ROLE_KEY` | yes      | **Secret.** Bypasses RLS — never ship it to the client      |
| `PORT`                      | no       | Defaults to 4000                                            |
| `NODE_ENV`                  | no       | `development` gives pretty logs and detailed error messages |
| `CORS_ORIGINS`              | no       | Comma-separated browser origins; native apps send no Origin |
| `LOG_LEVEL`                 | no       | pino level, defaults to `info`                              |

### 4. Apply migrations

Run the files in `supabase/migrations/` in filename order (Supabase SQL Editor or `supabase db push`). They are written to be re-runnable.

### 5. Run

```bash
cd server && npm start     # API on :4000
npx expo start             # app (use a development build)
```

---

## API

Base URL is the server root — **there is no `/api` prefix**. Every response is JSON shaped as `{ success: true, ... }` or `{ success: false, msg, code? }`.

Authentication is `Authorization: Bearer <Supabase access token>`.

### Posts

| Method   | Endpoint                                 | Auth     | Notes                                                 |
| -------- | ---------------------------------------- | -------- | ----------------------------------------------------- |
| `GET`    | `/posts?limit=&cursor=&username=`        | optional | Keyset pagination; a token makes `likedByMe` accurate |
| `GET`    | `/posts/:postId`                         | optional |                                                       |
| `GET`    | `/posts/:postId/comments?limit=&cursor=` | no       |                                                       |
| `POST`   | `/posts`                                 | yes      | Body `{ "body": "..." }`                              |
| `POST`   | `/posts/:postId/like`                    | yes      | Idempotent                                            |
| `DELETE` | `/posts/:postId/like`                    | yes      |                                                       |
| `POST`   | `/posts/:postId/comment`                 | yes      | Body `{ "text": "..." }`                              |
| `DELETE` | `/posts/:postId/comment/:commentId`      | yes      | Comment author or post owner                          |

Posts carry scalar counts rather than embedded rows:

```json
{
  "success": true,
  "data": [
    {
      "id": 43,
      "body": "Hello world",
      "userId": "2c75e728-…",
      "created_at": "2026-08-20T08:05:43.123456+00:00",
      "user": { "id": "2c75e728-…", "name": "Alice" },
      "likeCount": 3,
      "commentCount": 1,
      "likedByMe": true
    }
  ],
  "nextCursor": "MjAyNi0wOC0yMHwx"
}
```

Pass `nextCursor` back as `cursor` for the next page; `null` means the list is exhausted.

### Users

| Method   | Endpoint                   | Auth | Notes                      |
| -------- | -------------------------- | ---- | -------------------------- |
| `GET`    | `/users/me`                | yes  | Full profile of the caller |
| `GET`    | `/users/:userId`           | yes  | Public profile             |
| `POST`   | `/users/registerPushToken` | yes  | Bound to the token's user  |
| `DELETE` | `/users/pushToken`         | yes  | Called on logout           |

### Notifications

| Method  | Endpoint                                 | Auth | Notes                |
| ------- | ---------------------------------------- | ---- | -------------------- |
| `GET`   | `/notifications?limit=&cursor=`          | yes  | Scoped to the caller |
| `GET`   | `/notifications/unseen-count`            | yes  |                      |
| `POST`  | `/notifications/mark-seen`               | yes  | Idempotent           |
| `PATCH` | `/notifications/:notificationId/clicked` | yes  |                      |

### Health

`GET /health` → `{ "status": "ok", "uptime": 42 }`

---

## Push notifications

Android delivery needs all three of these, and it fails silently if any is missing:

1. `google-services.json` at the repo root, wired up via `expo.android.googleServicesFile`
2. An **FCM V1 service account key** uploaded to EAS (`eas credentials -p android`)
3. A development or production build — not Expo Go

For iOS, upload an APNs key with `eas credentials -p ios`.

The notification icon must be a **monochrome white-on-transparent** PNG (Android renders anything else as a solid square); this project uses `assets/images/android-icon-monochrome.png`.

---

## Environment variables for EAS builds

Build profiles in `eas.json` name an `environment` (`development` / `preview` / `production`). Create the variables once per environment so builds don't depend on a local `.env`:

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://<ref>.supabase.co"
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>"
eas env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value "https://<api host>"
```

Repeat for `development` and `preview`. Optionally upload `google-services.json` as a file-type variable (`GOOGLE_SERVICES_JSON`) instead of committing it.

Build:

```bash
eas build --profile development --platform android
eas build --profile development-simulator --platform ios   # iOS simulator build
eas build --profile production --platform android
```

---

## Scripts

| Command                 | What it does                                |
| ----------------------- | ------------------------------------------- |
| `npm run lint`          | ESLint (flat config), zero warnings allowed |
| `npm run format`        | Prettier write                              |
| `npm run typecheck`     | `tsc --noEmit`                              |
| `npm test`              | jest-expo client tests                      |
| `cd server && npm test` | jest + supertest API tests                  |

CI runs all of these on every pull request (`.github/workflows/ci.yml`).

---

## Security notes

- The **service-role key bypasses RLS**. It belongs only in the server's environment — never in the app or in `EXPO_PUBLIC_*`.
- RLS policies are per-user: you can only read your own `users` row and your own notifications, and you can only write rows you own. Posts, comments and likes are readable by signed-in users because Realtime needs `SELECT`.
- The API derives identity from the verified token, never from the request body.

---

## Tech stack

| Layer   | Choices                                                           |
| ------- | ----------------------------------------------------------------- |
| Mobile  | React Native, Expo SDK 57, expo-router, TanStack Query            |
| Backend | Node, Express 5, zod, pino, helmet                                |
| Data    | Supabase (PostgreSQL, Auth, Realtime), keyset pagination          |
| Push    | expo-server-sdk, FCM (Android), APNs (iOS)                        |
| Tooling | TypeScript, ESLint 10 flat config, Prettier, jest, GitHub Actions |

---

## Author

[@neel-asanulhaquekiron](https://github.com/neel-asanulhaquekiron)
