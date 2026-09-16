# AI_CONTEXT.md

This file provides guidance to AI code assistants (i.e. Claude Code (claude.ai/code)) when working with code in this repository.

## Modules

This is a monorepo with four modules:

- **`modules/core`** – Scala 3 backend (Cats Effect, http4s, Tapir, MongoDB)
- **`modules/openapi`** – Scala API documentation server using the core endpoint definitions
- **`modules/frontend`** – Next.js App Router web app (React, TypeScript, Tailwind CSS, TanStack Query)
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

### Frontend (Next.js, Node.js 24)
```sh
cd modules/frontend
npm ci                  # install locked dependencies
npm run dev             # dev server (port 3000)
npm run build           # production build with standalone output
npm start               # serve a production build
npm run lint            # ESLint
npm run typecheck       # TypeScript
npm test                # Vitest
npx playwright install chromium
npm run test:e2e         # Playwright with synthetic API fixtures
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

## Frontend Architecture

`modules/frontend/src/app/` uses Next.js App Router. Shared components live in `src/components/`; domain types, API hooks, and screens live in `src/features/`. TanStack Query manages server data. Forms use React Hook Form and Zod; charts use Recharts.

Browser API calls use same-origin `/api/*`. The server proxy in `src/lib/server/bff.ts` forwards only allowlisted core routes and stores the bearer token in an HttpOnly session cookie. `EXPENSE_TRACKER_CORE_URL` is a server-only origin without `/api`; it defaults to the hosted core. Set a local/test origin before testing mutations. Do not log credentials, cookies, tokens, or financial payloads. Automated tests must use synthetic fixtures rather than live account mutations.

The frontend runs as a Node.js server, not a static export. `/health` checks frontend process liveness. See `modules/frontend/README.md` for environment variables, container setup, and deployment boundaries. Its CI workflow is separate from the generated sbt workflow.

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
