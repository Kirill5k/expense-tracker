# AI_CONTEXT.md

This file provides guidance to AI code assistants (i.e. Claude Code (claude.ai/code)) when working with code in this repository.

## Modules

This is a monorepo with three modules:

- **`modules/core`** – Scala 3 backend (Cats Effect, http4s, Tapir, MongoDB)
- **`modules/frontend`** – Vue 2 PWA (Vuetify, Vuex, Vue Router) — **deprecated**
- **`modules/mobile`** – React Native/Expo app (Expo Router, NativeWind, WatermelonDB, Zustand)

## Commands

### Backend (sbt)
```sh
sbt compile
sbt test                                        # all tests
sbt "core/testOnly *TransactionControllerSpec"  # single test class
sbt "core/run"                                  # run the server locally (port 6000)
sbt "core/docker:publishLocal"                  # build Docker image
```

### Frontend (Vue CLI) — deprecated
```sh
cd modules/frontend
npm run serve   # dev server
npm run build   # production build
npm run lint    # lint
```

### Mobile (Expo)
```sh
cd modules/mobile
npx expo start          # start dev server
npx expo run:ios        # run on iOS simulator
npm test                # Jest tests
eas build --platform ios   # production build
eas submit -p ios          # submit to App Store
```

### Full stack
```sh
docker-compose up   # runs MongoDB + backend + frontend
```

## Backend Architecture

The backend is in `modules/core/src/main/scala/expensetracker/`. Each domain (`auth`, `category`, `transaction`, `account`, `sync`) follows the same layered structure:

```
<domain>/
  <Domain>.scala             # facade: wires controller + service + repository
  <Domain>Controller.scala   # Tapir HTTP endpoints
  <Domain>Service.scala      # business logic (tagless final, F[_])
  <Domain>.scala             # domain model types
  db/
    <Domain>Repository.scala # MongoDB data access via mongo4cats
    <Domain>Entity.scala     # MongoDB document representation
```

Key wiring points:
- `Application.scala` — entry point, assembles all modules and starts http4s server
- `Resources.scala` — builds shared resources (MongoDB client, etc.)
- `common/actions/` — `ActionDispatcher` (bounded queue) + `ActionProcessor` dispatches cross-domain side effects (e.g., cascading deletes on user deletion, periodic transaction generation). New cross-domain effects go here as `Action` enum cases.
- `common/web/` — base `Controller` trait, `Http` (aggregates all routes), Tapir schema/JSON helpers
- `common/config.scala` — config model loaded via pureconfig from `application.conf`

Auth uses JWT (HS256) + bcrypt. Sessions are stored in MongoDB. Config is read from env vars (`MONGO_CONNECTION_URI`, `JWT_SECRET_KEY`, `PASSWORD_SALT`, `PORT`).

Tests use embedded MongoDB (`mongo4cats-embedded`) — no external DB needed for testing. Controller tests use http4s test utilities from `common-http4s-test`.

## Mobile Architecture

`modules/mobile/app/` uses Expo Router (file-based routing):
- `(dashboard)/` — main tab screens
- `auth/` — login/registration screens
- `category/`, `transaction/`, `recurring/` — feature screens

State management:
- `store/` — Zustand stores
- `api/client.js` — Axios HTTP client for backend calls
- `db/` — WatermelonDB schema and models for offline-first local storage

UI: NativeWind (Tailwind CSS) + Gluestack UI components. Forms use React Hook Form + Zod validation.
