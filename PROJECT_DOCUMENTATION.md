# Tovo Backend — Project Documentation

> Last updated: 2026-03-23
> Purpose: Persistent technical reference for developers and AI assistants continuing development across sessions.

---

## Changelog

### 2026-03-23 - Support Module Admin Routes + Swagger Updates

#### Support module - admin ticket management added
- **Previously:** Only user/driver-facing support routes existed in `support.routes.js`, mounted at `/api/v1/support`. Admins had no dedicated mounted support-management endpoints in `app.js`.
- **Now:**
  - **`support.routes.js`** remains mounted at `/api/v1/support` for authenticated user/driver ticket actions: `POST /`, `GET /`, `GET /:id`, `POST /:id/messages`.
  - **`support.admin.routes.js`** (new) is mounted at `/api/v1/admin/support` and protected with `authenticate + authorize('admin')`.
  - New admin endpoints: `GET /` (paginated/filterable ticket list), `GET /:id` (any ticket detail), `POST /:id/respond`, and `PATCH /:id/resolve`.
  - `support.controller.js` now includes admin handlers: `listComplaints`, `getComplaint`, `respondToComplaint`, `resolveComplaint`.
  - `swagger/support/paths.yaml` now documents the admin support endpoints.
- **Files created:** `src/modules/support/support.admin.routes.js`
- **Files changed:** `src/app.js`, `src/modules/support/support.controller.js`, `swagger/support/paths.yaml`

---

### 2026-03-17 — Regions & Vehicle Models Public/Admin Split + File Renames

#### Regions module — public/admin route split
- **Previously:** Single `regions.routes.js` (no auth on any route) mounted at both `/api/v1/regions` and `/api/v1/admin/regions`. No public-facing active-only endpoint existed.
- **Now:**
  - **`regions.public.routes.js`** (new) — mounted at `/api/v1/regions`. `GET /` (active only) and `GET /:id` (active only, 404 if inactive). No auth.
  - **`regions.admin.routes.js`** (renamed from `regions.routes.js`) — mounted at `/api/v1/admin/regions`. All 5 routes (`GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`) protected with `adminOnly`.
  - **`regions.repository.js`** (new) — `findAllActive()` and `findActiveById(id)` (filters by `status: true`).
  - New service method: `getActiveRegion(id)` — calls `repo.findActiveById(id)`, throws 404 if null.
  - New controller handlers: `listActiveRegions`, `getActiveRegion`.
- **Files created:** `regions.repository.js`, `regions.public.routes.js`
- **Files renamed:** `regions.routes.js` → `regions.admin.routes.js`
- **Files changed:** `regions.service.js`, `regions.controller.js`, `app.js`

#### Vehicle models module — completed public/admin split
- **Previously:** Public routes file only had `GET /` (active list). Admin routes file had a stray `GET /active` with no auth, and `DELETE /:id` was missing `adminOnly`. No public `GET /:id` existed.
- **Now:**
  - **`vehicleModels.public.routes.js`** — added `GET /:id` with UUID validation → `getActiveModel` (returns 404 if inactive).
  - **`vehicleModels.admin.routes.js`** (renamed from `vehicleModels.routes.js`) — removed stray `GET /active`; added `...adminOnly` to `DELETE /:id`.
  - **`vehicleModels.repository.js`** — added `findActiveById(id)` (`findUnique` filtered by `isActive: true`).
  - New service method: `getActiveModel(id)` — calls `repo.findActiveById(id)`, throws 404 if null.
  - New controller handler: `getActiveModel`.
- **Files renamed:** `vehicleModels.routes.js` → `vehicleModels.admin.routes.js`
- **Files changed:** `vehicleModels.repository.js`, `vehicleModels.service.js`, `vehicleModels.controller.js`, `vehicleModels.public.routes.js`, `app.js`

---

### 2026-03-16 (2) — Services Module Refactor + app.js Routing Cleanup

#### Services module split into public and admin route files
- **Previously:** Single `services.routes.js` mixed public and admin routes; mounted at both `/api/v1/services` and `/api/v1/admin/services`; public `GET /` incorrectly returned ALL services including inactive; `GET /:id` returned inactive services; `DELETE /:id` was missing; `PATCH /{id}/image` was missing from Swagger
- **Now:**
  - **`services.public.routes.js`** (new) — mounted at `/api/v1/services`. Two routes: `GET /` (active only) and `GET /:id` (active only, 404 if inactive). No auth.
  - **`services.routes.js`** (admin only) — mounted at `/api/v1/admin/services`. All routes require admin JWT. `GET /` returns all services including inactive. `GET /:id` returns any service. `POST /`, `PATCH /:id`, `PATCH /:id/image` unchanged. `DELETE /:id` added.
  - New controller handlers: `listActiveServices`, `getActiveService`, `deleteService`
  - New service method: `deleteService(id)` — finds, deletes, invalidates cache
  - New repository method: `remove(id)`
- **Files changed:** `services.repository.js`, `services.service.js`, `services.controller.js`, `services.routes.js`, `app.js`
- **Files created:** `services.public.routes.js`

#### app.js routing fixes
- **Duplicate `services` mount removed** — `/api/v1/services` was mounted twice (lines 102 and 113 in the original). Duplicate removed.
- **Dashboard root mount removed** — `app.use('/api/v1', dashboardRoutes)` was exposing all dashboard routes at the API root without prefix. Removed; only `app.use('/api/v1/dashboard', dashboardRoutes)` remains.
- **Duplicate regions import with typo removed** — `regionstRoutes` (typo) imported the same file as `regionsRoutes` and was never used. Removed.
- **`PORT` fallback added** — `process.env.PORT || 3000`
- **Dead Swagger commented-out code removed** — lines 81–85 (old YAML file-based setup)

---

### 2026-03-16 — Trip Dispatch Refactor + Public Vehicle Models + Apple Sign-In

#### 1. Trip request dispatch moved to `emitTripRequest` in `socket.js`
- **Previously:** `trips.controller.js` `createTrip` contained an inline `nearbyCaptains.forEach(...)` loop that emitted `trip.new_request` directly. `trips.service.js` `createTrip` returned `{ trip, nearbyCaptains }` so the controller could reuse the already-computed nearby list.
- **Now:**
  - New exported function `emitTripRequest(io, trip, radiusKm = 10)` added to `src/realtime/socket.js`. It calls `locationStore.getNearby(trip.pickupLat, trip.pickupLng, radiusKm, trip.serviceId ?? null)`, logs if no drivers found, and emits `trip.new_request` to each `driver:{driverId}` room.
  - `trips.service.js` `createTrip` now returns just `trip` (the `nearbyCaptains` return value was removed). The `locationStore.getNearby()` call inside the service is kept for FCM push notifications (fire-and-forget).
  - `trips.controller.js` `createTrip` now calls `emitTripRequest(io, trip, 10)` instead of the inline forEach.
- **Files changed:** `src/realtime/socket.js`, `src/modules/trips/trips.service.js`, `src/modules/trips/trips.controller.js`

#### 2. Public `GET /vehicle-models` endpoint added
- **Previously:** `app.js` mounted `vehicleModels.routes.js` (the admin routes file) at both `/api/v1/vehicle-models` and `/api/v1/admin/vehicle-models`, so the public path incorrectly required admin auth.
- **Now:**
  - New file `src/modules/vehicle-models/vehicleModels.public.routes.js` — `GET /` calls `ctrl.listActiveModels` (no auth).
  - `listActiveModels` handler added to `vehicleModels.controller.js` — calls `service.listActiveModels()`.
  - `vehicleModels.service.js` already had `listActiveModels()` using `repo.findActive()`.
  - Bug fixed in `vehicleModels.repository.js`: `findAll` was calling non-existent `prisma.vehicleModel.findAll()` — corrected to `prisma.vehicleModel.findMany(...)`.
  - `app.js` now mounts public routes at `/api/v1/vehicle-models` and keeps admin routes at `/api/v1/admin/vehicle-models`.
- **Files changed:** `src/modules/vehicle-models/vehicleModels.controller.js`, `src/modules/vehicle-models/vehicleModels.repository.js`, `src/app.js`
- **Files created:** `src/modules/vehicle-models/vehicleModels.public.routes.js`

#### 3. Apple Sign-In added to social auth
- `POST /auth/social` now supports `provider: "apple"` in addition to `"google"` and `"facebook"`
- Apple verifies `identity_token` as a JWT; public keys fetched from `https://appleid.apple.com/auth/keys` and verified using `jsonwebtoken`
- Find-or-create logic: look up by `appleId` → then by email → create new user
- New env var: `APPLE_CLIENT_ID` (the app's bundle ID, e.g. `com.yourcompany.tovo`) — used as the audience (`aud`) claim in token verification
- New repo method in `auth.repository.js`: `findUserByAppleId()`
- `appleId String? @unique` added to `User` model in `schema.prisma`
- Migration: `20260316_add_apple_id`
- No new packages required

---

### 2026-03-14 (2) — Swagger Resolver Errors Fixed

#### Problem
Swagger UI showed resolver errors on startup:
- `Resolver error at paths./auth/register/user.post... Could not resolve reference: undefined Route GET /api/common/schemas.yaml not found`
- `Resolver error at paths./auth/login.post... Could not resolve reference: undefined Route GET /api/users/schemas.yaml not found`

#### Root Cause
`swagger/auth/paths.yaml` used relative file-path `$ref` syntax (e.g. `'../common/schemas.yaml#/SuccessResponse'`, `'../users/schemas.yaml#/User'`) which only works in multi-file Swagger setups. This project merges all YAML files into a single in-memory spec via `swagger.config.js`, so all cross-file refs must use the unified format `'#/components/schemas/<Name>'`.

Additionally, `SuccessResponse` was referenced but never defined in any schema file.

#### Fixes
- **`swagger/auth/paths.yaml`** — replaced 4 broken `$ref` values:
  - Line 25: `'../common/schemas.yaml#/SuccessResponse'` → `'#/components/schemas/SuccessResponse'`
  - Line 28: `'../users/schemas.yaml#/User'` → `'#/components/schemas/User'`
  - Line 91: `'../users/schemas.yaml#/User'` → `'#/components/schemas/User'`
  - Line 286: `'../users/schemas.yaml#/User'` → `'#/components/schemas/User'`
- **`swagger/auth/schemas.yaml`** — added `SuccessResponse` schema definition (object with `success: boolean`, `message: string`, `data: object`). This file is loaded first in `swagger.config.js` so the schema is available to all paths.

#### Rule for Future Swagger Work
All `$ref` values in any `paths.yaml` must use `'#/components/schemas/<Name>'` — never relative file paths. All schemas from all `schemas.yaml` files are merged into a single flat namespace at `components.schemas` by `swagger/swagger.config.js`.

---

### 2026-03-14 — Server Resource Optimization

#### Problem
Server was consuming excessive CPU and memory after deployment due to several issues: a blocking `console.log` on every GPS update, missing DB indexes causing full table scans, a duplicate location store lookup per trip, and repeated DB queries for rarely-changing data.

#### Fix 1 — Remove blocking `console.log` in locationStore (CRITICAL)
- **File:** `src/realtime/locationStore.js`
- **Previously:** `set()` called `console.log(store)` on every captain GPS update — synchronous I/O that serialized the entire Map and blocked the Node.js event loop
- **Now:** Line removed entirely
- **Impact:** With 50+ online drivers, this was causing thousands of blocking I/O calls per minute

#### Fix 2 — Add missing DB indexes
- **File:** `prisma/schema.prisma`
- **Previously:** Zero `@@index` directives — all filtered queries were full table scans
- **Now:** Added:
  - `Trip`: `@@index([userId])`, `@@index([driverId])`, `@@index([status])`
  - `Rating`: `@@index([driverId])`
  - `Notification`: `@@index([userId])`
  - `DeviceToken`: `@@index([userId])`
- **Migration required:** `npx prisma migrate dev --name add_indexes` (dev) / `npx prisma migrate deploy` (prod)

#### Fix 3 — Deduplicate `getNearby()` call per trip creation
- **Files:** `src/modules/trips/trips.service.js`, `src/modules/trips/trips.controller.js`
- **Previously:** `locationStore.getNearby()` was called twice per trip — once in `createTrip()` (service) for FCM push, and again in the controller for Socket.io emission
- **Now:** `createTrip()` returns `{ trip, nearbyCaptains }` instead of just `trip`; controller destructures and reuses the already-computed list for socket emission — one call per trip instead of two

#### Fix 4 — TTL in-memory cache for active regions
- **File:** `src/modules/regions/regions.service.js`
- **Previously:** `listActiveRegions()` hit the DB on every trip estimate and every trip creation
- **Now:** Result is cached in-process for 60 seconds. Cache is immediately invalidated (reset to `null`) on `createRegion`, `updateRegion`, `deleteRegion` so admin changes apply instantly
- **Pattern:** `_regionsCache` (data) + `_regionsCacheAt` (timestamp) + `REGIONS_TTL_MS = 60_000`

#### Fix 5 — TTL in-memory cache for active services
- **File:** `src/modules/services/services.repository.js`, `src/modules/services/services.service.js`
- **Previously:** `findAll()` hit the DB on every fare estimate
- **Now:** Same 60-second TTL cache pattern as regions. `invalidateServicesCache()` is exported from the repository and called in `services.service.js` after `createService`, `updateService`, `updateServiceImage`

---

### 2026-03-10 — Google + Facebook Social Login

#### Social auth implemented (`POST /auth/social`)
- **Previously:** threw `501 Not Implemented`
- **Now:** supports `provider: "google"`, `provider: "facebook"`, and `provider: "apple"` with find-or-create logic
- **Google:** verifies `id_token` via `google-auth-library` (`OAuth2Client.verifyIdToken`)
- **Facebook:** verifies `access_token` via Graph API HTTPS call (`no extra package`) — `https://graph.facebook.com/me?fields=id,name,email`
- **Apple:** verifies `identity_token` JWT using public keys from `https://appleid.apple.com/auth/keys` via `jsonwebtoken` (no extra package)
- **Find-or-create priority:** look up by `googleId`/`facebookId`/`appleId` → then by email (links social ID) → then create new user
- **New user created:** `isVerified: true`, wallet auto-created, `phone` left null (allowed now)
- **Role mismatch guard:** `409` if email/social ID belongs to a different role
- **New package:** `google-auth-library`
- **New config:** `src/config/google.js` — lazy `OAuth2Client` init (same pattern as `firebase.js`)
- **New env vars:** `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID` (bundle ID, e.g. `com.yourcompany.tovo`)
- **Schema changes:** `phone` made optional (`String?`); `googleId String? @unique`, `facebookId String? @unique`, `appleId String? @unique` added to `User`
- **Migrations:** `20260310200000_add_social_auth_fields`, `20260316_add_apple_id`
- **New repo methods in `auth.repository.js`:** `findUserByGoogleId()`, `findUserByFacebookId()`, `findUserByAppleId()`
- **No controller/route changes** — already wired

---

### 2026-03-10 — Firebase Push Notifications + Email OTP Password Reset

#### Firebase Push Notifications integrated into trip lifecycle
- **All 6 trip lifecycle hooks** now trigger FCM push notifications via the existing `notificationsService`
- **Only file modified:** `src/modules/trips/trips.service.js` — import added + 6 fire-and-forget calls
- **Hooks and recipients:**
  | Hook | Recipient | Method | Persisted? |
  |---|---|---|---|
  | Trip created | Each nearby driver | `sendToDriver()` | No |
  | Driver accepts | Passenger | `createAndSend()` | Yes |
  | Trip starts | Passenger | `createAndSend()` | Yes |
  | Trip ends | Passenger (with fare) | `createAndSend()` | Yes |
  | Passenger cancels | Driver (if matched) | `sendToDriver()` | No |
  | Passenger rates | Driver | `sendToDriver()` | No |
- **Pattern:** All calls are fire-and-forget (`.catch(() => {})`) — push failure never breaks the API response
- **`data` payload** includes `type` + `tripId` on every push for mobile deep linking

#### Notifications admin endpoints auth fixed
- `POST /notifications/send-to-user` and `POST /notifications/send-to-driver` were using `X-Admin-Key` header (`requireAdminKey` middleware) — now use standard `authenticate + authorize('admin')` JWT auth
- **File modified:** `src/modules/notifications/notifications.routes.js`

#### Forgot Password / Reset Password — fully implemented
- **Nodemailer installed** (`npm install nodemailer`)
- **New config:** `src/config/mailer.js` — lazy-initialized nodemailer transporter (same pattern as `firebase.js`)
- **New DB model:** `PasswordResetToken` (`password_reset_tokens` table) — fields: `id`, `email`, `code`, `expiresAt`, `isUsed`, `createdAt`
- **Migration:** `20260310171943_add_password_reset_tokens`
- **New repo methods** in `auth.repository.js`: `createPasswordResetToken`, `findValidPasswordResetToken`, `markPasswordResetTokenUsed`
- **`forgotPassword(email)`:** generates 6-digit OTP, stores in DB with 10-min expiry, sends HTML email via nodemailer. Always returns the same message (prevents email enumeration)
- **`resetPassword(email, otp, newPassword)`:** verifies OTP (non-expired, unused), marks used, hashes + saves new password
- **Route change:** `POST /auth/reset-password` body changed from `{ token, password }` → `{ email, otp, new_password }`
- **New env vars required:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`

#### YAML bug fix
- `swagger/trips/paths.yaml` line 145 had `'400'` description and `'422':` key merged on one line — fixed

---

### 2026-03-10 — API Endpoint Consolidation
- **Removed duplicate trip lifecycle endpoints** from `/api/v1/trips/*` routes and Swagger docs
- **Consolidated to captain-focused endpoints** at `/api/v1/captains/me/trips/*` for better API organization
- **Affected endpoints:** `accept_trip`, `decline_trip`, `start_trip`, `end_trip` (cancel_trip was already removed)
- **No functional changes:** Backend logic remains unchanged; captains routes delegate to trips controller
- **Files modified:** `src/modules/trips/trips.routes.js`, `swagger/trips/paths.yaml`

---

## 1. Project Overview

### Purpose
Tovo is a **ride-hailing and package delivery** REST API backend. It connects riders (users) with drivers (captains) in real time, handles the full trip lifecycle, processes payments, and provides an admin interface for operations management.

### Main Features
- User and Captain registration, authentication (JWT + OTP)
- **Email OTP-based forgot password / reset password** via nodemailer
- Real-time trip matching via Socket.io
- Fare estimation using haversine distance formula
- Service-area region validation (pickup must be inside a defined region)
- In-memory captain location tracking (zero DB writes for GPS)
- Wallet system for balance management, automatic trip settlement, and full transaction history log
- Payment methods (saved cards) + cash payment support
- Wallet refund system for card payments (admin-issued, with duplicate guard and transaction log)
- DB-driven commission rules with admin management panel
- Automatic captain wallet settlement on trip completion (cash vs card logic)
- **Firebase push notifications integrated into all trip lifecycle events** (new trip, accepted, started, completed, cancelled, rated)
- In-app notification history with read/unread tracking
- SOS alerts from users or captains
- Support ticket system with threaded messages
- FAQ management
- Coupon/promotion system
- Admin analytics and dashboard
- Swagger/OpenAPI 3 documentation at `/api/docs`

### Target Users
| Role | Description |
|------|-------------|
| `customer` | Riders booking trips |
| `driver` | Drivers accepting and fulfilling trips |
| `admin` | Operations team managing the platform (separate AdminUser table) |

---

## 2. System Architecture

### High-Level Architecture
```
Mobile App / Web Client
        │
        ▼
   REST API (Express)  ◄──── Swagger UI at /api/docs
        │
   Socket.io Layer     ◄──── Real-time GPS & trip events
        │
   Business Layer      (Services)
        │
   Data Layer          (Repositories → Prisma ORM → MySQL)
        │
   Firebase Admin      (Push Notifications)
   locationStore       (In-memory captain GPS cache)
```

### Backend Technologies
| Technology | Purpose |
|------------|---------|
| Node.js + Express 4 | HTTP server and routing |
| Prisma ORM v5 | Database access layer |
| MySQL | Primary database |
| Socket.io 4 | Real-time bidirectional communication |
| JWT (jsonwebtoken) | Stateless authentication |
| bcrypt | Password hashing |
| Firebase Admin SDK | Push notifications to mobile devices |
| Nodemailer | Transactional email (password reset OTP) |
| express-validator | Request validation |
| Multer | File uploads (avatar images) |
| Winston | Structured logging |
| Swagger (swagger-jsdoc + swagger-ui-express + yamljs) | API documentation |
| express-rate-limit | Rate limiting |
| Helmet + CORS | Security headers |

### Frontend
This repository is **backend-only**. No frontend code exists here.

### Service Interactions
```
HTTP Request
  → auth.middleware (authenticate + authorize)
  → validate.middleware (express-validator)
  → Controller (thin — extracts params, calls service, formats response)
  → Service (business logic, orchestration)
  → Repository (Prisma queries only)
  → MySQL via Prisma

Socket.io Events
  → socket.js auth middleware (JWT verification)
  → locationStore (in-memory Map — captain GPS)
  → Emitters called from controllers to push events to rooms:
      emitTripRequest(io, trip, radiusKm)   — queries locationStore, emits trip.new_request to nearby drivers
      emitCaptainMatched(io, userId, trip)  — notifies passenger of driver match
      emitTripStatusChanged(io, ...)        — broadcasts status change to trip room
      emitTripCancelled(io, ...)            — notifies both parties of cancellation
```

---

## 3. Backend Structure

### Folder Structure
```
tovo-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Seed data
├── src/
│   ├── app.js                 # Express app bootstrap, route mounts, Socket.io setup
│   ├── config/
│   │   ├── prisma.js          # Singleton Prisma client
│   │   ├── logger.js          # Winston logger
│   │   ├── firebase.js        # Lazy Firebase Admin SDK init
│   │   └── mailer.js          # Lazy nodemailer transporter (SMTP)
│   ├── middleware/
│   │   ├── auth.middleware.js # JWT authenticate + authorize(role)
│   │   ├── validate.middleware.js # express-validator error handler
│   │   └── error.middleware.js    # Global error handler
│   ├── realtime/
│   │   ├── socket.js          # Socket.io setup, event handlers, server emitters
│   │   └── locationStore.js   # In-memory Map for captain GPS (non-persistent)
│   ├── providers/
│   │   └── fcm.js             # FCM sendMulticast wrapper — handles invalid token cleanup
│   ├── utils/
│   │   ├── response.js        # success, created, error, notFound, paginate helpers
│   │   ├── jwt.js             # signAccessToken, signRefreshToken, verifyAccessToken
│   │   └── location.js        # findPointInRegions (haversine region check)
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── captains/
│       ├── trips/
│       ├── services/
│       ├── regions/
│       ├── vehicles/
│       ├── vehicle-models/
│       ├── wallets/
│       ├── payments/
│       ├── commissions/       # NEW — commission rule management
│       ├── coupons/
│       ├── notifications/
│       ├── support/
│       ├── faqs/
│       ├── sos/
│       ├── complaints/
│       ├── analytics/
│       ├── settings/
│       └── dashboard/
└── swagger/
    ├── swagger.config.js      # Loads and merges all YAML files into one spec
    ├── swagger.info.yaml      # API title, version, servers, securitySchemes
    └── <module>/
        ├── paths.yaml         # Endpoint definitions
        └── schemas.yaml       # Reusable component schemas
```

### Module File Convention
Most modules under `src/modules/<name>/` follow this pattern:

| File | Responsibility |
|------|---------------|
| `<name>.routes.js` | Route definitions, validation, auth middleware |
| `<name>.controller.js` | Extract params from req, call service, return response |
| `<name>.service.js` | Business logic, orchestration, cross-module calls |
| `<name>.repository.js` | All Prisma queries — only file that touches the DB |

**Rule:** Prisma is only ever accessed inside a repository file. Services never import `prisma` directly (except `trips.service.js` which has two legacy direct queries for rating aggregation and captain totalTrips increment — a known area for cleanup).

Some modules now have extra route files for public/admin separation, for example `services.public.routes.js`, `regions.public.routes.js` + `regions.admin.routes.js`, `vehicleModels.public.routes.js` + `vehicleModels.admin.routes.js`, and `support.admin.routes.js`.

### Key Middleware
- **`authenticate`** — Verifies `Authorization: Bearer <token>`, attaches `req.actor = { id, role }` to every request.
- **`authorize(...roles)`** — Role guard, e.g. `authorize('user')`, `authorize('captain')`, `authorize('user', 'captain')`.
- **`validate`** — Runs after express-validator chains, returns `400 Validation failed` with error array if any field fails.
- **`errorHandler`** — Global catch-all error middleware, formats unhandled errors as JSON.

### Helmet Configuration
Helmet is applied to all routes **except** `/api/docs` to avoid CSP blocking Swagger UI cross-origin requests:
```js
app.use((req, res, next) => {
  if (req.path.startsWith('/api/docs')) return next();
  helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })(req, res, next);
});
```

### Utilities
- **`response.js`** — All controllers use these helpers: `success(res, data, msg, statusCode, pagination)`, `created(res, data, msg)`, `error(res, msg, statusCode)`, `notFound(res, msg)`, `paginate(page, perPage, total)`.
- **`jwt.js`** — Issues and verifies access tokens (short-lived) and refresh tokens (long-lived).
- **`location.js`** — `findPointInRegions(lat, lng, regions[])` — checks if a coordinate falls within any active service region using haversine formula.

---

## 4. Database Design

### ORM
Prisma v5 with MySQL. Schema at `prisma/schema.prisma`.

### Main Models

| Model | Table | Description |
|-------|-------|-------------|
| `User` | `users` | Both customers and drivers in a single table. Customers ignore driver-only fields (`drivingLicense`, `licenseExpiryDate`, `isOnline`, `rating`, `totalTrips`, `serviceId`). Has wallet, saved addresses, payment methods, trips |
| `AdminUser` | `admin_users` | Separate admin accounts table (not merged into User) with email, passwordHash, isActive, role |
| `Vehicle` | `vehicles` | One vehicle per driver. Links to VehicleModel. FK: `userId` |
| `VehicleModel` | `vehicle_models` | Make/model catalogue, linked to a Service |
| `Service` | `services` | Ride categories (e.g. Economy, Comfort). Has `baseFare` |
| `Trip` | `trips` | Core trip record with full lifecycle. References `userId` (customer) and `driverId` (driver from same User table) |
| `TripDecline` | `trip_declines` | Composite key `(tripId, driverId)` — tracks which drivers declined |
| `Rating` | `ratings` | One per trip, customer rates driver (1–5 stars) |
| `PaymentMethod` | `payment_methods` | Saved cards per user (visa, mastercard, apple_pay) |
| `Wallet` | `wallets` | Balance for customer or driver. Credited/debited automatically on trip completion |
| `WalletTransaction` | `wallet_transactions` | Immutable log of every credit/debit on a wallet. Created atomically with every balance change |
| `CommissionRule` | `commission_rules` | DB-driven commission rules with type, config JSON, and per-service scoping |
| `Promotion` | `promotions` | Marketing banners/promotions |
| `Coupon` | `coupons` | Discount codes with usage limits and expiry |
| `SupportTicket` | `support_tickets` | Ticket raised by user or driver |
| `TicketMessage` | `ticket_messages` | Threaded messages inside a ticket |
| `Notification` | `notifications` | In-app notifications per user |
| `DeviceToken` | `device_tokens` | Firebase push tokens for users/drivers |
| `Otp` | `otps` | OTP codes for phone verification |
| `PasswordResetToken` | `password_reset_tokens` | Email OTP codes for password reset. Fields: `email`, `code`, `expiresAt` (10 min), `isUsed`. No FK to User — matched by email only |
| `RefreshToken` | `refresh_tokens` | Long-lived JWT refresh tokens |
| `Region` | `regions` | Circular service areas (lat, lng, radius in km) |
| `SosAlert` | `sos_alerts` | Emergency alerts from users or drivers |
| `Faq` | `faqs` | Ordered FAQ entries |
| `InsuranceCard` | `insurance_cards` | Driver insurance documents |
| `SystemSetting` | `system_settings` | Key-value store for app-wide config. Fields: `id` (UUID), `key` (unique), `value` (string), `createdAt`, `updatedAt` |

### Key Enums
- `Role`: `customer | driver | admin`
- `TripStatus`: `searching | matched | on_way | in_progress | completed | cancelled`
- `PaymentBrand`: `visa | mastercard | apple_pay`
- `SupportTicketStatus`: `open | in_progress | resolved | closed`
- `DiscountType`: `percentage | amount`
- `CommissionType`: `fixed_amount | percentage | tiered_fixed | tiered_percentage`
- `TransactionType`: `credit | debit`

### Key Relationships
```
User          ──< Trip (as rider)
Captain       ──< Trip (as driver)
Service       ──< Trip
Service       ──< Captain
Service       ──< VehicleModel
Service       ──< CommissionRule (optional — null = global rule)
VehicleModel  ──< Vehicle
Captain       ──1 Vehicle
User/Captain  ──1 Wallet
Trip          ──1 Rating
Trip          ──< TripDecline
User          ──< PaymentMethod
PaymentMethod ──< Trip
User/Captain  ──1 SupportTicket (many)
SupportTicket ──< TicketMessage
```

### Trip Model — Key Fields
| Field | Type | Description |
|---|---|---|
| `fare` | Decimal | Total amount charged to the passenger |
| `commission` | Decimal? | Platform cut (deducted from fare) |
| `driverEarnings` | Decimal? | What the captain receives (fare − commission) |
| `paymentType` | String? | `'cash'` or `'card'` |

### WalletTransaction Model
| Field | Type | Description |
|---|---|---|
| `walletId` | String | FK to the wallet being affected |
| `type` | TransactionType | `credit` or `debit` |
| `amount` | Decimal | Absolute (always positive) amount of the change |
| `reason` | String | Standard values: `trip_earnings_credit`, `trip_commission_deduction`, `refund`, or the admin-supplied reason string |
| `tripId` | String? | Set when transaction originated from a trip settlement or refund |

### CommissionRule Model
| Field | Type | Description |
|---|---|---|
| `name` | String | Human-readable label |
| `type` | CommissionType | Rule evaluation strategy |
| `serviceId` | String? | null = global; non-null = applies to specific service only |
| `status` | Boolean | `false` by default; only one rule can be `true` per serviceId at a time |
| `config` | Json | Rule-specific payload (see commission system section) |

---

## 5. API Design

### Base URL
```
http://localhost:<PORT>/api/v1        (local)
https://tovo-b.developteam.site/api/v1  (production)
```

### Authentication Flow
1. User/Driver registers → password hashed with bcrypt → stored in single `users` table with appropriate role
2. For **customer/driver** login: `POST /auth/login` with `identifier` (email or phone, auto-detected), `password`, and `role` (customer|driver)
3. For **admin** login: `POST /auth/admin/login` with `email`, `password` → looks up separate `admin_users` table
4. Server issues `accessToken` (JWT, short-lived) + `refreshToken` (long-lived)
5. All protected endpoints require `Authorization: Bearer <accessToken>`
6. `authenticate` middleware verifies token → attaches `req.actor = { id, role }`
7. `authorize(roles...)` guard role access
8. Refresh via `POST /auth/token/refresh` with the refresh token

**Auto-detection in login:** The `identifier` field is checked for `@` character — if present, it's treated as email; otherwise as phone number.

### Major Endpoints by Module

#### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register/user` | — | Register customer |
| POST | `/register/captain` | — | Register driver |
| POST | `/login` | — | Login customer or driver (email or phone via `identifier` field) |
| POST | `/admin/login` | — | Login admin account (separate AdminUser table) |
| POST | `/logout` | Bearer | Invalidate refresh token |
| POST | `/token/refresh` | — | Exchange refresh token for new access token |
| POST | `/otp/send` | — | Send OTP to phone |
| POST | `/otp/verify` | — | Verify OTP and mark user as verified |
| POST | `/forgot-password` | — | Send 6-digit OTP to user's email. Body: `{ email }`. Always returns same message (prevents enumeration) |
| POST | `/reset-password` | — | Verify OTP + set new password. Body: `{ email, otp, new_password }` |
| POST | `/social` | — | Social auth — `provider: google \| facebook \| apple` |

#### Users — `/api/v1/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | user | Get own profile |
| PATCH | `/me` | user | Update profile |
| GET | `/me/addresses` | user | Saved addresses |
| POST | `/me/addresses` | user | Add address |
| GET | `/me/payment-methods` | user | Saved payment methods |
| POST | `/me/payment-methods` | user | Add payment method |

#### Captains — `/api/v1/captains`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | captain | Own profile |
| PATCH | `/me` | captain | Update profile |
| POST | `/me/duty/start` | captain | Go online (sets `isOnline = true`) |
| POST | `/me/duty/end` | captain | Go offline |
| GET | `/me/vehicle` | captain | Own vehicle |
| POST | `/me/vehicle` | captain | Register vehicle |
| GET | `/me/trips` | captain | Captain trip history |
| PATCH | `/me/trips/:id/accept` | captain | Accept trip request |
| PATCH | `/me/trips/:id/decline` | captain | Decline trip request |
| PATCH | `/me/trips/:id/start` | captain | Start trip (pickup customer) |
| PATCH | `/me/trips/:id/end` | captain | End trip + settle captain wallet |

#### Trips — `/api/v1/trips`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/estimate` | user | Fare estimate |
| POST | `/` | user | Create trip request |
| GET | `/` | user | User trip history |
| GET | `/nearby-captains` | any | Nearby online captains from locationStore |
| GET | `/captain/requests` | captain | Open trip requests not yet declined |
| GET | `/captain/trips` | captain | Captain trip history |
| GET | `/captains/:captainId/ratings` | any | Captain ratings |
| GET | `/:id` | user/captain | Trip details |
| PATCH | `/:id/cancel` | user | Cancel trip |
| POST | `/:id/rating` | user | Rate captain (1–5 stars) |

**Trip Creation Body:**
```json
{
  "pickup_lat": 30.0444,
  "pickup_lng": 31.2357,
  "pickup_address": "123 Main St",
  "dropoff_lat": 30.1050,
  "dropoff_lng": 31.3100,
  "dropoff_address": "456 Side St",
  "service_id": "<uuid>",
  "payment_type": "cash | card",
  "payment_method_id": "<uuid>  (required only when payment_type = card)"
}
```

**Fare Estimate Response Shape:**
```json
{
  "distanceKm": 12.5,
  "farePerKm": 5.0,
  "baseFare": 10.0,
  "serviceName": "Economy",
  "fare": 72.5,
  "commission": 5.0,
  "driverEarnings": 67.5,
  "currency": "EGP"
}
```

#### Commission Rules — `/api/v1/admin/commissions`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | admin | List all commission rules |
| POST | `/` | admin | Create a new rule (starts inactive) |
| GET | `/:id` | admin | Get a single rule |
| PATCH | `/:id` | admin | Update rule fields (name, type, config, serviceId) |
| PATCH | `/:id/activate` | admin | Activate rule — atomically deactivates current active rule for same service |
| DELETE | `/:id` | admin | Delete rule |

#### Vehicle Models — `/api/v1/vehicle-models` and `/api/v1/admin/vehicle-models`
Public routes served by `vehicleModels.public.routes.js`; admin routes by `vehicleModels.admin.routes.js`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/vehicle-models` | — | List active vehicle models |
| GET | `/vehicle-models/:id` | — | Get active model by ID — 404 if inactive |
| GET | `/admin/vehicle-models` | admin | List all vehicle models including inactive |
| GET | `/admin/vehicle-models/:id` | admin | Get any vehicle model regardless of status |
| POST | `/admin/vehicle-models` | admin | Create a vehicle model |
| PUT | `/admin/vehicle-models/:id` | admin | Update a vehicle model |
| DELETE | `/admin/vehicle-models/:id` | admin | Delete a vehicle model (`?confirm=true` required) |

#### Services — `/api/v1/services` and `/api/v1/admin/services`
Public routes served by `services.public.routes.js`; admin routes by `services.routes.js`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/services` | — | List active services only |
| GET | `/services/:id` | — | Get service by ID — 404 if inactive |
| GET | `/admin/services` | admin | List all services including inactive |
| GET | `/admin/services/:id` | admin | Get any service regardless of status |
| POST | `/admin/services` | admin | Create a service |
| PATCH | `/admin/services/:id` | admin | Update name, baseFare, or isActive |
| PATCH | `/admin/services/:id/image` | admin | Update service image (multipart) |
| DELETE | `/admin/services/:id` | admin | Delete a service |

#### Regions — `/api/v1/regions` and `/api/v1/admin/regions`
Public routes served by `regions.public.routes.js`; admin routes by `regions.admin.routes.js`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/regions` | — | List active regions only |
| GET | `/regions/:id` | — | Get active region by ID — 404 if inactive |
| GET | `/admin/regions` | admin | List all regions including inactive (paginated, filterable) |
| GET | `/admin/regions/:id` | admin | Get any region regardless of status |
| POST | `/admin/regions` | admin | Create a region |
| PUT | `/admin/regions/:id` | admin | Update a region |
| DELETE | `/admin/regions/:id` | admin | Delete a region |

#### Payments — `/api/v1/payments` and `/api/v1/admin/payments`
Both paths served by the same router (`payments.routes.js`). Auth enforced per route inline.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/payments/me` | user | Own payment history (completed trips only) |
| GET | `/payments/:id` | user / admin | Single payment detail — users can only access their own |
| GET | `/admin/payments` | admin | All payments, filterable by `userId`, `driverId`, `paymentType`, `dateFrom`, `dateTo` |
| POST | `/admin/payments/:id/refund` | admin | Issue wallet refund for a card payment — guards: trip must be `completed`, type must be `card`, amount ≤ fare, no duplicate refund. Creates a `WalletTransaction` atomically |

#### Support — `/api/v1/support` and `/api/v1/admin/support`
User/driver routes are served by `support.routes.js`. Admin routes are served by `support.admin.routes.js`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | any | Create ticket |
| GET | `/` | any | List own tickets |
| GET | `/:id` | any | Ticket detail |
| POST | `/:id/messages` | any | Add message to ticket |
| GET | `/admin/support` | admin | List all support tickets (paginated, filterable by `status`, `type`, `search`) |
| GET | `/admin/support/:id` | admin | Get any support ticket by ID |
| POST | `/admin/support/:id/respond` | admin | Add an admin response to a ticket |
| PATCH | `/admin/support/:id/resolve` | admin | Mark a support ticket as resolved |

#### Wallets — `/api/v1/wallets` and `/api/v1/admin/wallets`
Both paths are served by the same router (`wallets.routes.js`). Auth is enforced per route inline.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallets/me` | user / captain | Own wallet balance and details |
| GET | `/wallets/me/transactions` | user / captain | Own paginated wallet transaction history |
| GET | `/admin/wallets` | admin | List all wallets (filterable by ownerType, search) |
| GET | `/admin/wallets/:id` | admin | Single wallet detail |
| GET | `/admin/wallets/:id/transactions` | admin | Transaction history for any wallet |
| POST | `/admin/wallets/:id/adjust` | admin | Credit or debit a wallet manually (logged as WalletTransaction) |

#### Notifications — `/api/v1/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user/captain | List own notifications (paginated) |
| PATCH | `/read-all` | user/captain | Mark all as read |
| PATCH | `/:id/read` | user/captain | Mark single notification as read |
| POST | `/device-token` | user/captain | Register FCM device token. Body: `{ token, platform: ios\|android\|web }` |
| POST | `/send-to-user` | admin | Manually push to a user. Body: `{ user_id, title, body, data? }` |
| POST | `/send-to-driver` | admin | Manually push to a driver. Body: `{ driver_id, title, body, data? }` |

**Implementation details:**
- Device tokens are stored in `DeviceToken` table, upserted on registration, auto-cleaned on FCM failure
- `createAndSend()` — creates a persistent `Notification` DB record AND sends FCM push (used for trip lifecycle events that should appear in notification history)
- `sendToUser()` / `sendToDriver()` — FCM-only push, no DB record (used for transient alerts)
- All admin push endpoints use standard JWT `authenticate + authorize('admin')` (previously used `X-Admin-Key` — changed)

#### FAQs — `/api/v1/faqs`
- `GET /` — Public list
- Admin CRUD at `/api/v1/admin/faqs` (not yet mounted in app.js — pending)

#### Coupons — `/api/v1/promotions`
- `GET /` — Active promotions (public)
- `POST /coupons/validate` — Validate coupon code
- Admin CRUD at `/api/v1/admin/promotions/coupons`

#### SOS — `/api/v1/sos`
- `POST /` — Submit SOS alert
- Admin at `/api/v1/admin/sos`

#### Dashboard — `/api/v1/dashboard`
- Summary stats for admin

#### Analytics — `/api/v1/analytics`
- Ride stats, driver performance, user activity reports

#### Settings — `/api/v1/settings` and `/api/v1/admin/settings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/settings` | — | All settings as flat `{ key: value }` map (mobile/public) |
| GET | `/admin/settings/all` | admin | All settings as full object array |
| POST | `/admin/settings` | admin | Create a setting — body: `{ key, value }` |
| PATCH | `/admin/settings/:id` | admin | Update a setting — body: `{ key?, value? }` |
| DELETE | `/admin/settings/:id` | admin | Delete a setting |

Both public and admin routes are defined in a single file (`settings.routes.js`) with `authenticate + authorize('admin')` applied inline to admin-only routes. The router is mounted at both paths in `app.js`.

### Response Shape
All responses use the `response.js` utility and follow this envelope:
```json
{
  "success": true,
  "message": "...",
  "data": { ... } | [ ... ],
  "pagination": {               // only on paginated endpoints
    "page": 1,
    "perPage": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 6. Frontend Structure

This is a **backend-only repository**. No frontend code exists in this project.

---

## 7. Business Logic

### User Registration Flow
1. `POST /auth/register` with `name, email, phone, password, role`
2. Password hashed with bcrypt
3. User/Captain record created in DB
4. Access + refresh tokens returned
5. OTP phone verification can be triggered separately

### Driver Registration Flow
1. Register via `POST /auth/register/captain` with `name, email, phone, password, driving_license, vehicle_model, vin`
2. Driver (role: `driver`) created in `users` table with `isVerified: false`, `isOnline: false`
3. Vehicle record created linked to the driver
4. Wallet created for the driver
5. Admin must verify driver (sets `isVerified: true`)
6. Driver chooses a service category (`serviceId` on driver record via vehicle model)
7. Driver calls `POST /drivers/me/duty/start` to go online

### Ride Request Flow
```
1. Customer calls GET /trips/estimate  →  receives fare + commission + driverEarnings breakdown
2. Customer calls POST /trips          →  trip created with status: searching
   - Service validated (active)
   - Pickup validated inside an active Region (haversine check)
   - fare = baseFare + distanceKm × FARE_PER_KM
   - commission + driverEarnings calculated via commission rules (see below)
   - trips.service.js calls locationStore.getNearby() → sends FCM push to each nearby driver (fire-and-forget)
   - trips.service.js returns just `trip`
   - Controller calls emitTripRequest(io, trip, 10) → socket.js queries locationStore again and emits 'trip.new_request' to each nearby driver's private room

3. Driver receives 'trip.new_request' event / push notification
4. Driver calls PATCH /trips/:id/accept → status: matched
   - Customer receives 'trip.captain_matched' via Socket.io
   - Other drivers receive 'trip.taken' (removed from their list)
   - Customer receives FCM push "Driver On The Way" (persisted in notification history)

5. Driver calls PATCH /trips/:id/start  → status: in_progress
   - Both customer and driver receive 'trip.status_changed'
   - Customer receives FCM push "Trip Started" (persisted in notification history)

6. During trip: Driver emits 'driver.location_update' via Socket.io
   - Stored in locationStore (no DB write)
   - Forwarded to trip room: customer sees live driver position

7. Driver calls PATCH /trips/:id/end   → status: completed
   - Driver's totalTrips incremented
   - Driver wallet settled (see Wallet Settlement below)
   - Customer receives FCM push "Trip Completed" with fare amount (persisted in notification history)

8. Customer calls POST /trips/:id/rating    → Rating created
   - Driver's average rating recalculated
   - Driver receives FCM push "New Rating" (fire-and-forget)

Cancellation: Customer calls PATCH /trips/:id/cancel → status: cancelled
   - If a driver was matched, driver receives FCM push "Trip Cancelled" (fire-and-forget)
```

### Driver Decline Flow
- Driver calls `PATCH /trips/:id/decline`
- A `TripDecline` record is created for `(tripId, driverId)`
- `GET /trips/driver/requests` filters out trips with this driver's decline
- Other drivers still see the trip (upsert prevents duplicate declines)

### Region Management Flow
- Admin creates regions with `name, lat, lng, radius` (km)
- On trip creation, `validatePickupInRegion()` runs haversine check against all active regions
- If pickup is outside all regions → `422` error
- If no active regions exist → trips are allowed (backward compatibility)

### Fare Calculation
```
distanceKm     = haversine(pickupLat, pickupLng, dropoffLat, dropoffLng)
driverEarnings = distanceKm × FARE_PER_KM                 ← what captain earns
commission     = calculateCommission(driverEarnings, serviceId)  ← platform cut (added on top)
fare           = driverEarnings + commission               ← what passenger pays
```
- `FARE_PER_KM` defaults to `5.0` (override via env var)
- `Service.baseFare` exists on the model but is **not used** in the current fare calculation
- Commission is **added on top** of driverEarnings to produce the fare — it is NOT deducted from fare
- Commission is DB-driven (see Commission System below)

### Commission System
Commission rules are stored in the `CommissionRule` table and managed by admins.

**Rule selection priority:**
1. Active (`status = true`) rule with matching `serviceId`
2. Active global rule (`serviceId = null`)
3. Fallback: `COMMISSION_PCT` env var as a percentage (if no DB rules active)

**Rule types and config shapes:**

| type | config |
|---|---|
| `percentage` | `{ "pct": 15 }` |
| `fixed_amount` | `[{ "minFare": 0, "maxFare": 99.99, "amount": 5 }, { "minFare": 100, "maxFare": null, "amount": 10 }]` |
| `tiered_fixed` | Same array shape as `fixed_amount` |
| `tiered_percentage` | `[{ "minFare": 0, "maxFare": 100, "pct": 8 }, { "minFare": 100, "maxFare": null, "pct": 12 }]` |

**Activation rules:**
- New rules are always created with `status = false`
- Activating a rule via `PATCH /admin/commissions/:id/activate` runs an atomic transaction:
  1. Deactivates any currently active rule for the same `serviceId`
  2. Activates the requested rule
- Only one rule can be active per `serviceId` (including `null`) at any time

### Wallet Settlement on Trip Completion
When `PATCH /trips/:id/end` is called:

| Payment type | Action | WalletTransaction reason |
|---|---|---|
| `cash` | Customer paid driver directly — **deduct `commission`** from driver wallet | `trip_commission_deduction` |
| `card` | Platform received payment — **credit `driverEarnings`** to driver wallet | `trip_earnings_credit` |

Settlement is skipped if `commission` or `driverEarnings` is null on the trip record. Every settlement is recorded atomically as a `WalletTransaction` (balance update + log entry in a single Prisma `$transaction`).

### Wallet Transaction Log
Every balance change — whether from trip settlement, admin manual adjustment, or a refund — creates an immutable `WalletTransaction` record atomically with the balance update. This provides a full audit trail. The `reason` field distinguishes the source:
- `trip_earnings_credit` — card trip settled, captain credited
- `trip_commission_deduction` — cash trip settled, commission deducted from captain
- `refund` — admin issued a refund to a user's wallet
- Any free-text string — admin manual adjustment via `POST /admin/wallets/:id/adjust`

### Refund Flow
Admin calls `POST /admin/payments/:id/refund` with `{ amount, reason }`. Guards checked in order:
1. Trip must exist
2. Trip status must be `completed`
3. `paymentType` must be `card` (cash payments were not collected by the platform)
4. `amount` must not exceed the original `fare`
5. No existing refund `WalletTransaction` for this `tripId` (prevents duplicates — returns `409`)

On success: customer wallet balance incremented + `WalletTransaction { type: credit, reason: refund }` created atomically.

### Forgot Password Flow
1. `POST /auth/forgot-password` — body: `{ email }`
   - Looks up user by email; if not found, **still returns success** (prevents email enumeration)
   - Generates random 6-digit OTP code
   - Saves to `PasswordResetToken` table with `expiresAt = now + 10 minutes`
   - Sends HTML email via nodemailer with the OTP code
2. `POST /auth/reset-password` — body: `{ email, otp, new_password }`
   - Looks up a valid (non-expired, unused) `PasswordResetToken` matching email + code
   - If not found → `400 Invalid or expired OTP`
   - Marks token as `isUsed = true`
   - Hashes new password with bcrypt (12 rounds)
   - Updates `User.passwordHash` where email matches

**Guards:**
- OTP expiry enforced by `expiresAt: { gt: new Date() }` query filter
- OTP reuse prevented by `isUsed: false` filter; token marked used before password update
- Email enumeration prevented — forgot-password always returns `200` regardless of whether email exists

### Real-Time Location Tracking
- Driver GPS is stored in `locationStore` — a Node.js `Map` in process memory
- Updated via `driver.location_update` Socket.io event
- Entries older than `STALE_MS` (default 2 minutes) are lazily evicted on read and periodically cleaned every 30s
- `locationStore.getNearby(lat, lng, radiusKm, serviceId)` uses a bounding-box pre-filter for performance
- Used by `POST /trips` to find drivers to notify, and by `GET /trips/nearby-drivers`

---

## 8. Environment & Configuration

### Environment Variables (`.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | — (required) |
| `PORT` | HTTP server port | — (required) |
| `JWT_ACCESS_SECRET` | Access token signing secret | — (required) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — (required) |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | e.g. `7d` |
| `FARE_PER_KM` | Fare multiplier per kilometre | `5.0` |
| `COMMISSION_PCT` | Fallback commission % (used only when no active DB rule exists) | `15` |
| `RATE_LIMIT_DISABLED` | Set `true` to disable rate limiter | `false` |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window | `15` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | — (required for push) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | — (required for push) |
| `FIREBASE_PRIVATE_KEY` | Firebase private key (escaped `\n`) | — (required for push) |
| `SMTP_HOST` | SMTP server hostname | — (required for email) |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS (`true`/`false`) | `false` |
| `SMTP_USER` | SMTP auth username | — (required for email) |
| `SMTP_PASS` | SMTP auth password / app password | — (required for email) |
| `SMTP_FROM_NAME` | Display name in From field | `Tovo` |
| `SMTP_FROM_EMAIL` | From email address | — (required for email) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID (from Google Cloud Console) | — (required for Google social login) |
| `APPLE_CLIENT_ID` | Apple app bundle ID (e.g. `com.yourcompany.tovo`) — used as JWT audience claim | — (required for Apple Sign-In) |

### Important Config Files
- `prisma/schema.prisma` — Single source of truth for the database schema
- `swagger/swagger.config.js` — Merges all YAML swagger files at startup
- `swagger/swagger.info.yaml` — Server URLs (local + production)
- `src/config/prisma.js` — Singleton Prisma client (import from here everywhere)
- `src/config/logger.js` — Winston logger instance
- `src/config/firebase.js` — Lazy Firebase Admin SDK init (reads `FIREBASE_*` env vars)
- `src/config/mailer.js` — Lazy nodemailer transporter (reads `SMTP_*` env vars)

---

## 9. Deployment Notes

### Run Locally
```bash
# Install dependencies
npm install

# Generate Prisma client after schema changes
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database
npx prisma db seed

# Start development server (nodemon)
npm run dev

# Start production server
npm start

# Open Prisma Studio (DB GUI)
npm run prisma:studio
```

### Swagger UI
- Local: `http://localhost:<PORT>/api/docs`
- Production: `https://tovo-b.developteam.site/api/docs`

### Static File Serving
Uploaded avatar images are served as static files via:
```js
app.use('/uploads', express.static('uploads'));
```
Files are stored in the `uploads/` directory at the project root. Multer uses `diskStorage` with a custom `filename` function that preserves the original file extension:
```js
filename: (req, file, cb) => {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  cb(null, `avatar-${unique}${path.extname(file.originalname)}`);
}
```
Example stored filename: `avatar-1741427600000-482910372.jpg`. Avatar URLs returned by the API are always full URLs in the form `http(s)://<host>/uploads/<filename>`, constructed using `req.protocol` and `req.get('host')` in the controller — not relative paths. This applies to both `PATCH /captains/me/avatar` and `PATCH /users/me/avatar`.

### Critical: Prisma Client Regeneration
**`npx prisma generate` must be re-run on the server after every schema change.** Skipping this causes `Cannot read properties of undefined (reading 'findFirst'|'findUnique'|...)` errors at runtime because the generated client is out of sync with `schema.prisma`. Always run `prisma generate` + `prisma migrate deploy` when deploying schema changes.

### Debug Endpoint
`GET /debug/locations` — Returns current in-memory captain location store (remove in production).

---

## 10. Future Extensions

### Known Pending Work
- **Admin routes not fully mounted**: `admin.routes.js` is commented out in `app.js`. Complaints and some other admin sub-routes have controller/service code written but not wired up.
- **`regions.service.js` fix**: The `status` field must be cast to `Boolean` when creating a region — currently causes a Prisma type error when client sends `1` instead of `true`.
- **Admin authentication**: The admin module uses `authorize('admin')` but the JWT payload role needs to match. Admin login flow should be verified end-to-end.
- **Wallet top-up / captain withdrawal**: No endpoint exists for users to top up their wallet or captains to request a payout. Requires payment gateway integration.
- **Prisma client regeneration required**: After the `PasswordResetToken` migration (`20260310171943_add_password_reset_tokens`) and previous `WalletTransaction` migration, run `npx prisma generate` with the server stopped to sync the generated client. Skipping this causes runtime errors on `prisma.passwordResetToken.*` / `prisma.walletTransaction.*` calls.
- **Phone OTP SMS not integrated**: `sendOtp()` still uses a hardcoded `'123456'` code. SMS provider (Twilio, Vonage, etc.) not yet wired up.

### Designed for Scalability
- **locationStore** can be replaced with Redis (same interface) for multi-instance deployments without code changes to the service layer
- **Repository pattern** makes it straightforward to swap Prisma for another ORM or add caching
- **Socket.io rooms** are already structured (`user:{id}`, `captain:{id}`, `trip:{id}`) for easy migration to Redis adapter
- **Module-per-feature** structure makes adding new domains (e.g., scheduled rides, surge pricing) isolated
- **Commission rules** are fully DB-driven — new rule types can be added without code changes by extending the `config` JSON shape

---

## Context Summary for AI Assistants

Tovo is a Node.js/Express ride-hailing and package delivery backend. Stack: Express 4, Prisma ORM v5, MySQL, Socket.io, JWT auth, Firebase push notifications, Nodemailer (SMTP email), Swagger/OpenAPI docs at `/api/docs`. The project is backend-only with no frontend. Architecture is strictly layered: **Controller → Service → Repository** — only repositories access Prisma. Auth middleware sets `req.actor = { id, role }` (not `req.user`). Three roles: `customer` (riders), `driver` (drivers), `admin`. User and Driver models are merged into a single `User` table with `role` field and driver-only fields (`drivingLicense`, `licenseExpiryDate`, `isOnline`, `rating`, `totalTrips`, `serviceId`). AdminUser is a separate table for admin accounts. Login endpoint accepts `identifier` field (auto-detects email vs phone). Separate admin login endpoint: `POST /auth/admin/login` with email and password. Most modules live under `src/modules/<name>/` with the standard `routes/controller/service/repository` layout, but some modules now have extra route files for public/admin separation (for example services, regions, vehicle-models, and support). Swagger docs are loaded from YAML files in `swagger/<module>/paths.yaml` and merged in `swagger/swagger.config.js`. Swagger server URLs: local = `http://localhost:3000/api/v1`, production = `https://tovo-b.developteam.site/api/v1`. Real-time driver GPS is stored in an in-memory `locationStore` (never written to DB); Socket.io rooms are `user:{id}`, `driver:{id}`, `trip:{id}`, `drivers:available`. Trip lifecycle states: `searching → matched → on_way → in_progress → completed | cancelled`. Fare = `driverEarnings + commission` (what customer pays). `driverEarnings = distanceKm × FARE_PER_KM`. Commission is **added on top** of driverEarnings via DB-driven `CommissionRule` records — NOT deducted from fare. `Service.baseFare` exists on the model but is not used in the current calculation. Driver wallet is automatically settled on `endTrip`: cash trips deduct commission (`reason: trip_commission_deduction`), card trips credit driverEarnings (`reason: trip_earnings_credit`). Every wallet balance change (trip settlement, admin adjust, refund) creates a `WalletTransaction` record atomically via Prisma `$transaction`. Commission rules are managed at `/api/v1/admin/commissions`; activate endpoint atomically swaps the active rule per service. Fallback when no active rule: `COMMISSION_PCT` env var as percentage. Trips store `paymentType` (`cash`/`card`), `commission`, and `driverEarnings` as explicit columns. Wallets module is at `src/modules/wallets/` — routes mounted at both `/api/v1/wallets` (user/driver) and `/api/v1/admin/wallets` (admin); auth is enforced inline per route. Payments module is at `src/modules/payments/` — has a `payments.repository.js`. Support module is at `src/modules/support/` — user/driver endpoints are mounted at `/api/v1/support`, while admin management endpoints are mounted separately at `/api/v1/admin/support` via `support.admin.routes.js`; admin support routes use `authenticate + authorize('admin')`. Refund endpoint guards: trip completed, card payment only, amount ≤ fare, no duplicate (checked via `WalletTransaction` with `reason: refund` for same `tripId`). Helmet is bypassed for `/api/docs` to allow Swagger UI cross-origin requests; all other routes use `crossOriginResourcePolicy: cross-origin`. Response utility is at `src/utils/response.js` and exports `success, created, error, notFound, paginate`. Middleware paths are always `../../middleware/` from inside a module. Settings module is fully implemented: `settings.routes.js` (single file for public + admin routes), `settings.controller.js`, `settings.service.js`, `settings.repository.js`. Public `GET /settings` returns a flat `{ key: value }` map; admin routes are protected by inline `authenticate + authorize('admin')` and mounted at `/api/v1/admin/settings`. The `SystemSetting` model uses a UUID `id` primary key with `key` as a unique field — value is always stored as a plain string (client parses type). Avatar uploads use `multer.diskStorage` with a custom `filename` function that preserves the original file extension (`path.extname(file.originalname)`) — produces filenames like `avatar-1741427600000-482910372.jpg`. The `uploads/` directory is served as static files. Avatar URLs are always full backend URLs built with `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`. Always run `npx prisma generate` + `npx prisma migrate deploy` after any schema change on the server, or Prisma model accessors will be undefined at runtime. Firebase push notifications are fully integrated into the trip lifecycle inside `trips.service.js` — `notificationsService` (from `src/modules/notifications/notifications.service.js`) is called fire-and-forget at every lifecycle hook. The notifications module has `sendToUser(userId, title, body, data)`, `sendToDriver(driverId, title, body, data)`, `createAndSend(userId, title, body, data)` (persists + sends), and `sendBulk(tokens, ...)`. Device tokens stored in `DeviceToken` table; invalid tokens are auto-cleaned after FCM send failures. FCM provider at `src/providers/fcm.js` calls `messaging().sendEachForMulticast()`. Firebase config at `src/config/firebase.js` (lazy init, reads `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). Notifications admin endpoints (`send-to-user`, `send-to-driver`) use standard JWT `authenticate + authorize('admin')` — NOT `X-Admin-Key`. Forgot password is fully implemented: `POST /auth/forgot-password` (body: `{ email }`) generates a 6-digit OTP, stores it in `PasswordResetToken` table (10-min expiry), and sends an HTML email via nodemailer. `POST /auth/reset-password` (body: `{ email, otp, new_password }`) verifies the OTP and updates the password. `src/config/mailer.js` is the lazy nodemailer transporter using `SMTP_*` env vars. `PasswordResetToken` model: `email`, `code`, `expiresAt`, `isUsed`, no FK to User. `locationStore.set()` does NOT log to console — the debug `console.log(store)` was removed (it was blocking the event loop on every GPS update). `trips.service.js` `createTrip()` returns just `trip` (not `{ trip, nearbyCaptains }`). Socket emission is handled by `emitTripRequest(io, trip, radiusKm)` exported from `src/realtime/socket.js` — it queries `locationStore.getNearby()` internally. The service still calls `getNearby()` independently for FCM push notifications (fire-and-forget). `services.repository.js` `findAll()` uses a 60-second in-process TTL cache (returns active only); `invalidateServicesCache()` is exported and called by `services.service.js` after every write (create, update, delete). Services module uses two route files: `services.public.routes.js` (public, active-only GET endpoints, no auth) mounted at `/api/v1/services`, and `services.routes.js` (admin CRUD, requires admin JWT) mounted at `/api/v1/admin/services`. Public `GET /services/:id` returns 404 for inactive services. Admin `DELETE /admin/services/:id` calls `service.deleteService()` which validates existence, deletes, and invalidates the cache. `regions.service.js` `listActiveRegions()` uses the same 60-second TTL cache pattern; cache is invalidated immediately on create/update/delete. DB indexes added to `Trip` (`userId`, `driverId`, `status`), `Rating` (`driverId`), `Notification` (`userId`), `DeviceToken` (`userId`) — migration `add_indexes` must be deployed to the server. Swagger `$ref` values in all `paths.yaml` files must use `'#/components/schemas/<Name>'` — never relative file paths like `'../module/schemas.yaml#/Name'`. All schemas are merged into a single flat namespace by `swagger/swagger.config.js`. `SuccessResponse` schema is defined in `swagger/auth/schemas.yaml` (loaded first) and is available globally as `#/components/schemas/SuccessResponse`.

