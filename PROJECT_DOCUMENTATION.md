# Tovo Backend — Project Documentation

> Last updated: 2026-04-08 (rev 7)
> Purpose: Persistent technical reference for developers and AI assistants continuing development across sessions.

---

## Changelog
### 2026-04-08 (rev 7) - Firebase Client-Side Phone Auth Migration

#### Problem
The documentation still described a backend-owned phone OTP flow with `POST /auth/otp/send`, database-stored OTP codes, and a server-side `otps` table. The backend has now been migrated to Firebase client-side phone authentication instead.

#### Solution
- Removed documentation for `POST /auth/otp/send`
- Updated `POST /auth/otp/verify` to document Firebase ID token verification instead of `{ phone, otp_code }`
- Documented the two backend outcomes of phone verification:
  - existing phone number -> login response with JWTs
  - new phone number -> `requiresRegistration: true` response with the verified phone number
- Removed `Otp` / `otps` from the schema documentation
- Updated registration/auth flow notes to reflect client-side Firebase phone verification
- Updated environment-variable notes so `FIREBASE_*` credentials are documented as required for both push notifications and phone-auth token verification

---
### 2026-04-07 (rev 6) - Documentation Sync With Current Backend Surface

#### Problem
`PROJECT_DOCUMENTATION.md` had drifted from the current codebase in several critical areas: route mounts (`/drivers` vs `/drivers`), payment capabilities (cash-only), database models (driver profile split), and newer modules/features (trip sharing + toll gates).

#### Solution
- Updated API module sections to match mounted routes in `src/app.js`
- Replaced legacy driver-centric endpoint docs with current driver-facing paths under `/api/v1/drivers`
- Removed stale `PaymentMethod`/card-payment assumptions and documented cash-only payment behavior
- Added missing trip-share endpoints (`POST /trips/:id/share-link`, `GET /trips/share/:token`) and share-token behavior
- Added toll gates module coverage (`/api/v1/admin/toll-gates`)
- Updated schema documentation to include `DriverProfile` as the driver-only data model linked 1:1 with `User`
- Corrected business-flow descriptions to match current service/controller logic
- Added missing `GET /api/v1/vehicles/me` endpoint for drivers to retrieve their own vehicle details
- Updated Swagger documentation to include the new vehicles endpoint

---
### 2026-03-25 (rev 5) â€” Fare Field Rename + Centralized Socket/Push Dispatch

#### Problem
Trip pricing docs and realtime behavior had drifted from the current backend. The API contract still referred to `fare` / `fareBeforeDiscount`, while the implementation had moved toward explicit pre-discount and post-discount pricing semantics. Socket events were also handled inconsistently across services, controllers, and the realtime layer.

#### Solution
- Renamed the trip pricing API fields to `originalFare` and `finalFare`
- Kept `discountAmount` as the dedicated coupon-discount field
- Clarified that driver settlement uses pre-discount pricing and adds `trip_coupon_reimbursement` when a coupon discount exists
- Centralized non-location socket events in `emitRealtimeEvent()` inside `src/realtime/socket.js`
- Every existing non-location socket event now emits over Socket.io and sends an unconditional FCM push with the same event name in the payload
- `trip.driver_location` remains socket-only by design
- Standardized private customer socket rooms as `user:{id}`

---

### 2026-03-25 (rev 4) — Trip Coupon Application + Public Endpoint Docs

#### Problem
The coupons module could validate coupon codes, but it had no endpoint to attach a coupon to a trip and persist the resulting discount. Public API behavior was also spread across route files and Swagger fragments with no single current-state document for non-admin endpoints.

#### Solution
- Added `POST /api/v1/promotions/coupons/apply` for customers
- Trips now persist coupon snapshot fields: `couponId`, `couponCode`, `originalFare`, `discountAmount`, and `finalFare`
- Coupon application is allowed only for the trip owner while the trip is still `searching`
- Once a coupon is applied to a trip, it cannot be swapped; a second apply request returns `422`
- Discount reduces the rider fare only; `driverEarnings` and `commission` are unchanged
- Coupon usage is counted on trip completion, not on apply
- Added `PUBLIC_ENDPOINTS_DOCUMENTATION.md` as the current-state reference for mounted non-admin endpoints

**Migration:** `20260325113000_add_trip_coupon_fields`

---

### 2026-03-24 (rev 3) — CommissionRule Simplification: global-only rules

#### Problem
`commission_rules.serviceId` made commission configuration service-specific, but the current product direction is to manage commission rules globally instead of per-service.

#### Solution
- Dropped `serviceId` from the `CommissionRule` model and database table
- `calculateCommission()` now looks up a single global active rule
- Activating a rule now deactivates any other active rule globally
- Admin create/update endpoints no longer accept `serviceId`
- Swagger and seed data updated to match the global-only rule model

**Migration:** `20260324153000_drop_service_id_from_commission_rules`

---

### 2026-03-24 (rev 2) — Commission Module Split: commission-rules + earnings

#### Problem
The single `commissions` module combined two unrelated concerns: commission rule configuration (CRUD, activate/deactivate) and commission log records (immutable earnings per trip). This caused naming ambiguity — "commissions" could mean either the rules engine or the financial records.

#### Solution: split into two dedicated modules

**`src/modules/commission-rules/`** — rule configuration (renamed from `commissions/`)
- Files: `commission-rules.repository.js`, `commission-rules.service.js`, `commission-rules.controller.js`, `commission-rules.routes.js`
- Mounted at `/api/v1/admin/commission-rules`
- Contains: all rule CRUD, `validateConfig`, `evaluateRule`, `calculateCommission`

**`src/modules/earnings/`** — platform commission log (extracted from `commissions/`)
- Files: `earnings.repository.js`, `earnings.controller.js`, `earnings.routes.js`
- Mounted at `/api/v1/admin/earnings`
- Contains: `createCommissionLog`, `listCommissionLogs`, `sumCommissionLogs`

**API path changes:**
| Old | New |
|---|---|
| `GET /api/v1/admin/commissions` | `GET /api/v1/admin/commission-rules` |
| `POST /api/v1/admin/commissions` | `POST /api/v1/admin/commission-rules` |
| `GET /api/v1/admin/commissions/:id` | `GET /api/v1/admin/commission-rules/:id` |
| `PATCH /api/v1/admin/commissions/:id` | `PATCH /api/v1/admin/commission-rules/:id` |
| `PATCH /api/v1/admin/commissions/:id/activate` | `PATCH /api/v1/admin/commission-rules/:id/activate` |
| `DELETE /api/v1/admin/commissions/:id` | `DELETE /api/v1/admin/commission-rules/:id` |
| `GET /api/v1/admin/commissions/earnings` | `GET /api/v1/admin/earnings` |

**Files created:** `src/modules/commission-rules/` (4 files), `src/modules/earnings/` (3 files), `swagger/commission-rules/` (2 yaml files), `swagger/earnings/` (2 yaml files)
**Files deleted:** entire `src/modules/commissions/` directory, entire `swagger/commissions/` directory
**Files changed:** `src/app.js`, `src/modules/trips/trips.service.js`, `src/modules/dashboard/dashboard.service.js`, `swagger/swagger.config.js`

---

### 2026-03-24 — CommissionLog: Platform Earnings Tracking

#### Problem
Commission per trip was stored only in the `trips.commission` field. For cash trips a `WalletTransaction` existed showing the driver's deduction, but for card trips the platform's cut was retained implicitly with no record written anywhere. The dashboard exposed total fares only, not platform commission. There was no admin endpoint to inspect earnings.

#### Solution: new `CommissionLog` model + admin endpoint + dashboard update

**New model — `CommissionLog` (`commission_logs` table):**
| Field | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `tripId` | String @unique | One log per completed trip (FK → trips) |
| `amount` | Decimal(10,2) | Platform commission earned |
| `paymentType` | String | `'cash'` or `'card'` |
| `serviceId` | String? | FK → services (nullable) |
| `createdAt` | DateTime | Timestamp of settlement |

**Where the log is written:**
- `trips.service.js` `endTrip()` — after wallet settlement, if `trip.commission > 0`, `commissionRepo.createCommissionLog()` is called. Works for both cash and card trips.

**New repository functions** in `src/modules/earnings/earnings.repository.js` (originally added to `commissions.repository.js`, moved in rev 2):
- `createCommissionLog({ tripId, amount, paymentType, serviceId })` — insert one log
- `listCommissionLogs({ dateFrom, dateTo, paymentType, serviceId, page, perPage })` — paginated list with filters
- `sumCommissionLogs(where)` — aggregate sum (used by earnings endpoint and dashboard)

**New admin endpoint** — `GET /api/v1/admin/earnings` (originally `GET /api/v1/admin/commissions/earnings`, renamed in rev 2)
- Query params: `dateFrom`, `dateTo`, `paymentType` (`cash`|`card`), `serviceId`, `page`, `perPage`
- Returns paginated `logs` array + `totalEarned` (all-time sum)

**Dashboard update** — `GET /api/v1/dashboard` now includes two new fields:
- `totalCommission` — all-time platform commission from `commission_logs`
- `todayCommission` — today's platform commission

**Migration:** `20260324085145_add_commission_log`

**Files changed:**
- `prisma/schema.prisma` — `CommissionLog` model added; back-relations on `Trip` and `Service`
- `src/modules/earnings/earnings.repository.js` — 3 new functions (file path updated in rev 2)
- `src/modules/trips/trips.service.js` — imports `commissionRepo`; `endTrip()` writes log after wallet settlement
- `src/modules/earnings/earnings.controller.js` — `listEarnings` handler (file path updated in rev 2)
- `src/modules/earnings/earnings.routes.js` — `GET /` route (file path updated in rev 2)
- `src/modules/dashboard/dashboard.service.js` — imports `commissionRepo`; `adminDashboard()` returns `totalCommission` + `todayCommission`

---

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
- **Previously:** `trips.controller.js` `createTrip` contained an inline `nearbyDrivers.forEach(...)` loop that emitted `trip.new_request` directly. `trips.service.js` `createTrip` returned `{ trip, nearbyDrivers }` so the controller could reuse the already-computed nearby list.
- **Now:**
  - New exported function `emitTripRequest(io, trip, radiusKm = 10)` added to `src/realtime/socket.js`. It calls `locationStore.getNearby(trip.pickupLat, trip.pickupLng, radiusKm, trip.serviceId ?? null)`, logs if no drivers found, and emits `trip.new_request` to each `driver:{driverId}` room.
  - `trips.service.js` `createTrip` now returns just `trip` (the `nearbyDrivers` return value was removed).
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
- **Previously:** `set()` called `console.log(store)` on every driver GPS update — synchronous I/O that serialized the entire Map and blocked the Node.js event loop
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
- **Now:** `createTrip()` returns `{ trip, nearbyDrivers }` instead of just `trip`; controller destructures and reuses the already-computed list for socket emission — one call per trip instead of two
- **Current-state note (rev 5):** trip realtime dispatch is now centralized in `src/realtime/socket.js` via shared helpers, and non-location trip events send both socket emissions and push notifications together

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
- **Consolidated to driver-focused endpoints** at `/api/v1/drivers/me/trips/*` for better API organization
- **Affected endpoints:** `accept_trip`, `decline_trip`, `start_trip`, `end_trip` (cancel_trip was already removed)
- **No functional changes:** Backend logic remains unchanged; drivers routes delegate to trips controller
- **Files modified:** `src/modules/trips/trips.routes.js`, `swagger/trips/paths.yaml`

---

## 1. Project Overview

### Purpose
Tovo is a **ride-hailing and package delivery** REST API backend. It connects riders (customers) with drivers in real time, handles the full trip lifecycle, processes cash-trip settlement, and provides an admin interface for operations management.

### Main Features
- Customer and driver registration, authentication (JWT + Firebase phone verification)
- **Email OTP-based forgot password / reset password** via nodemailer
- Real-time trip matching via Socket.io
- Fare estimation using haversine distance formula
- Service-area region validation (pickup must be inside a defined region)
- In-memory driver location tracking (zero DB writes for GPS)
- Wallet system for balance management, automatic trip settlement, and full transaction history log
- Cash-only trip payments
- DB-driven commission rules with admin management panel
- Automatic driver wallet settlement on trip completion (commission deduction + coupon reimbursement when applicable)
- **Firebase push notifications integrated into all trip lifecycle events** (new trip, accepted, started, completed, cancelled, rated)
- In-app notification history with read/unread tracking
- Trip share links with expiring tokens for public tracking
- SOS alerts from users or drivers
- Support ticket system with threaded messages
- FAQ management
- Coupon/promotion system
- Admin analytics and dashboard
- Toll-gates admin management module
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
   locationStore       (In-memory driver GPS cache)
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
  → locationStore (in-memory Map — driver GPS)
  → Emitters called from controllers to push events to rooms:
      emitTripRequest(io, trip, radiusKm)   — queries locationStore, emits trip.new_request to nearby drivers
      emitDriverMatched(io, userId, trip)  — notifies passenger of driver match
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
│   │   └── locationStore.js   # In-memory Map for driver GPS (non-persistent)
│   ├── providers/
│   │   └── fcm.js             # FCM sendMulticast wrapper — handles invalid token cleanup
│   ├── utils/
│   │   ├── response.js        # success, created, error, notFound, paginate helpers
│   │   ├── jwt.js             # signAccessToken, signRefreshToken, verifyAccessToken
│   │   └── location.js        # findPointInRegions (haversine region check)
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── drivers/
│       ├── trips/
│       ├── services/
│       ├── regions/
│       ├── toll-gates/
│       ├── vehicles/
│       ├── vehicle-models/
│       ├── wallets/
│       ├── payments/
│       ├── commission-rules/  # Commission rule configuration (CRUD + calculateCommission)
│       ├── earnings/          # Platform commission log (immutable earnings records)
│       ├── coupons/
│       ├── notifications/
│       ├── support/
│       ├── faqs/
│       ├── sos/
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

**Rule of thumb:** Prisma should live in repository files. The codebase mostly follows this pattern, but there are still legacy service/controller Prisma calls in some modules.

Some modules now have extra route files for public/admin separation, for example `services.public.routes.js`, `regions.public.routes.js` + `regions.admin.routes.js`, `vehicleModels.public.routes.js` + `vehicleModels.admin.routes.js`, and `support.admin.routes.js`.

### Key Middleware
- **`authenticate`** — Verifies `Authorization: Bearer <token>`, attaches `req.actor = { id, role }` to every request.
- **`authorize(...roles)`** — Role guard, e.g. `authorize('customer')`, `authorize('driver')`, `authorize('customer', 'driver')`.
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
| `User` | `users` | Shared identity/account model for both customers and drivers (auth fields, profile basics, role, verification, language, notification preferences) |
| `DriverProfile` | `driver_profiles` | Driver-only fields in a dedicated 1:1 table linked by `userId` (`drivingLicense`, `licenseExpiryDate`, `isOnline`, `rating`, `totalTrips`, `serviceId`) |
| `AdminUser` | `admin_users` | Separate admin accounts table (not merged into User) with email, passwordHash, isActive, role |
| `Vehicle` | `vehicles` | One vehicle per driver. Links to VehicleModel. FK: `userId` |
| `VehicleModel` | `vehicle_models` | Make/model catalogue, linked to a Service |
| `Service` | `services` | Ride categories (e.g. Normal, Comfort, Motorcycle, Packages) and surcharge config |
| `TollGate` | `toll_gates` | Configurable toll gates with coordinates, fee, and active flag (admin-managed) |
| `Trip` | `trips` | Core trip record with lifecycle state, pricing fields, optional coupon snapshot, and share-link token fields (`shareToken`, `shareTokenExpiresAt`) |
| `TripStop` | `trip_stops` | Ordered multi-stop waypoints per trip (`order`, `lat`, `lng`, `address`, `arrivedAt`) |
| `TripDecline` | `trip_declines` | Composite key `(tripId, driverId)` — tracks which drivers declined |
| `Rating` | `ratings` | One per trip, customer rates driver (1–5 stars) |
| `Wallet` | `wallets` | Balance for customer or driver. Credited/debited automatically on trip completion |
| `WalletTransaction` | `wallet_transactions` | Immutable log of every credit/debit on a wallet. Created atomically with every balance change |
| `CommissionRule` | `commission_rules` | DB-driven global commission rules with type and config JSON |
| `CommissionLog` | `commission_logs` | Immutable log of platform commission earned per completed trip. One record per trip (`tripId @unique`). Current trip flow writes `paymentType: "cash"` |
| `Promotion` | `promotions` | Marketing banners/promotions |
| `Coupon` | `coupons` | Discount codes with usage limits and expiry. Can be attached to trips; `used_count` increments when discounted trips complete |
| `SupportTicket` | `support_tickets` | Ticket raised by user or driver |
| `TicketMessage` | `ticket_messages` | Threaded messages inside a ticket |
| `Notification` | `notifications` | In-app notifications per user |
| `DeviceToken` | `device_tokens` | Firebase push tokens for users/drivers |
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
- `SupportTicketStatus`: `open | in_progress | resolved | closed`
- `DiscountType`: `percentage | amount`
- `CommissionType`: `fixed_amount | percentage | tiered_fixed | tiered_percentage`
- `TransactionType`: `credit | debit`

### Key Relationships
```
User           ──< Trip (as customer)
User           ──< Trip (as driver)
User           ──1 DriverProfile
User           ──1 Vehicle (driver only)
User           ──1 Wallet
Service        ──< VehicleModel
Service        ──< DriverProfile
Service        ──< Trip
Trip           ──< TripStop
Trip           ──< TripDecline
Trip           ──1 Rating
SupportTicket  ──< TicketMessage
```

### Trip Model — Key Fields
| Field | Type | Description |
|---|---|---|
| `finalFare` | Decimal | Final amount charged to the passenger after discount |
| `originalFare` | Decimal? | Raw trip price before coupon discount |
| `discountAmount` | Decimal | Discount applied by coupon; defaults to `0` |
| `commission` | Decimal? | Platform cut calculated from the pre-discount trip price |
| `driverEarnings` | Decimal? | Driver payout basis calculated from the pre-discount trip price |
| `paymentType` | String? | Currently `cash` in active trip flows |
| `shareToken` | String? | 48-hex token used for public trip sharing |
| `shareTokenExpiresAt` | DateTime? | Expiration timestamp for the share token |

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
| `status` | Boolean | `false` by default; only one rule can be `true` globally at a time |
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
2. For **customer/driver** login: `POST /auth/login` with `identifier` (email or phone, auto-detected) and `password`; backend infers role from the matched user record
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
| POST | `/register/driver` | — | Register driver |
| POST | `/login` | — | Login customer or driver (email or phone via `identifier` field) |
| POST | `/admin/login` | — | Login admin account (separate AdminUser table) |
| POST | `/logout` | Bearer | Invalidate refresh token |
| POST | `/token/refresh` | — | Exchange refresh token for new access token |
| POST | `/otp/verify` | — | Verify Firebase phone-auth ID token. Existing phone -> login response; new phone -> registration-required response |
| POST | `/forgot-password` | — | Send 6-digit OTP to user's email. Body: `{ email }`. Always returns same message (prevents enumeration) |
| POST | `/reset-password` | — | Verify OTP + set new password. Body: `{ email, otp, new_password }` |
| POST | `/social` | — | Social auth — `provider: google \| facebook \| apple` |

#### Users — `/api/v1/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | customer | Get own profile |
| PUT | `/me` | customer | Update profile |
| PATCH | `/me/avatar` | customer | Update avatar |
| GET | `/me/wallet` | customer | Get own wallet |
| GET | `/me/addresses` | customer | List saved addresses |
| POST | `/me/addresses` | customer | Add saved address |
| PUT | `/me/addresses/:id` | customer | Update saved address |
| DELETE | `/me/addresses/:id` | customer | Delete saved address |
| GET | `/` | admin | List customers |
| POST | `/` | admin | Create customer |
| GET | `/:userId` | admin | Get customer details |
| PUT | `/:userId` | admin | Update customer |
| POST | `/:userId/suspend` | admin | Suspend/unsuspend customer |
| POST | `/:userId/refund` | admin | Credit customer wallet refund |
| POST | `/:userId/reset-password` | admin | Reset customer password |
| DELETE | `/:userId` | admin | Delete customer (`?confirm=true`) |

#### Drivers — `/api/v1/drivers`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | driver | Own profile |
| PUT | `/me` | driver | Update profile |
| PATCH | `/me/avatar` | driver | Update avatar |
| POST | `/me/duty/start` | driver | Set driver online |
| POST | `/me/duty/end` | driver | Set driver offline |
| GET | `/me/wallet` | driver | Get own wallet |
| GET | `/me/insurance` | driver | Driver insurance cards |
| GET | `/me/trips` | driver | Driver trip history |
| PATCH | `/me/trips/:id/accept` | driver | Accept trip request |
| PATCH | `/me/trips/:id/decline` | driver | Decline trip request |
| PATCH | `/me/trips/:id/start` | driver | Start trip |
| PATCH | `/me/trips/:id/end` | driver | End trip + settle wallet |
| PATCH | `/me/trips/:id/stops/:stopId/arrive` | driver | Mark stop as arrived |
| POST | `/me/trips/:tripId/credit-customer` | driver | Credit customer wallet from driver wallet |
| GET | `/` | public | List drivers (filterable) |

Admin driver management is mounted under `/api/v1/admin/drivers` (list/get/create/update/approve/reject/suspend/refund/reset-password/delete).

#### Trips — `/api/v1/trips`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/regions/active` | public | List active service regions |
| GET | `/estimate` | public | Fare estimate (supports optional multi-stop JSON) |
| POST | `/` | customer | Create trip request |
| GET | `/` | customer | Customer trip history |
| POST | `/:id/stops` | customer | Append trip stops before start |
| POST | `/:id/share-link` | customer | Generate expiring share link token |
| GET | `/share/:token` | public | Read shared trip live payload |
| GET | `/nearby-drivers` | authenticated | Nearby online drivers from `locationStore` |
| GET | `/driver/requests` | driver | Open trip requests not yet declined |
| GET | `/driver/trips` | driver | Driver trip history |
| GET | `/drivers/:driverId/ratings` | authenticated | Driver ratings |
| GET | `/:id` | customer/driver | Trip details |
| PATCH | `/:id/cancel` | customer | Cancel trip |
| POST | `/:id/rating` | customer | Rate driver (1–5 stars) |

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
  "payment_type": "cash",
  "stops": [
    { "lat": 30.08, "lng": 31.27, "address": "Optional waypoint" }
  ]
}
```

**Fare Estimate Response Shape:**
```json
{
  "serviceId": "uuid",
  "serviceName": "Normal",
  "distanceKm": 12.5,
  "farePerKm": 5,
  "fixedSurcharge": 0,
  "perStopSurcharge": 0,
  "stopsCount": 0,
  "stopsSurcharge": 0,
  "originalFare": 72.5,
  "finalFare": 72.5,
  "discountAmount": 0,
  "commission": 10.5,
  "driverEarnings": 62,
  "currency": "EGP"
}
```

#### Commission Rules — `/api/v1/admin/commission-rules`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | admin | List all commission rules |
| POST | `/` | admin | Create a new rule (starts inactive) |
| GET | `/:id` | admin | Get a single rule |
| PATCH | `/:id` | admin | Update rule fields (name, type, config) |
| PATCH | `/:id/activate` | admin | Activate rule — atomically deactivates any currently active rule |
| DELETE | `/:id` | admin | Delete rule |

#### Earnings — `/api/v1/admin/earnings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | admin | List platform commission logs. Query params: `dateFrom`, `dateTo`, `paymentType` (currently `cash`), `serviceId`, `page`, `perPage`. Returns paginated `logs` + `totalEarned` |

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

#### Vehicles — `/api/v1/vehicles` and `/api/v1/admin/vehicles`
Both paths served by the same router (`vehicles.routes.js`). Auth enforced per route inline.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/vehicles/me` | driver | Get own vehicle details |
| GET | `/admin/vehicles` | admin | List all vehicles (filterable by driverId, vehicleModelId) |
| GET | `/admin/vehicles/:id` | admin | Single vehicle detail |
| POST | `/admin/vehicles` | admin | Create vehicle for driver |
| PUT | `/admin/vehicles/:id` | admin | Update vehicle |
| DELETE | `/admin/vehicles/:id` | admin | Delete vehicle |

#### Toll Gates — `/api/v1/admin/toll-gates`
Admin routes served by `tollGates.admin.routes.js`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/toll-gates` | admin | List toll gates (paginated) |
| GET | `/admin/toll-gates/:id` | admin | Get toll gate by ID |
| POST | `/admin/toll-gates` | admin | Create toll gate |
| PUT | `/admin/toll-gates/:id` | admin | Update toll gate |
| DELETE | `/admin/toll-gates/:id` | admin | Delete toll gate (`?confirm=true`) |

#### Payments — `/api/v1/payments` and `/api/v1/admin/payments`
Both paths served by the same router (`payments.routes.js`). Auth enforced per route inline.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/payments/me` | customer | Own payment history (completed cash trips) |
| GET | `/payments/:id` | customer / admin | Single payment detail — customers can only access their own |
| GET | `/admin/payments` | admin | All payments, filterable by `userId`, `driverId`, `paymentType` (cash), `dateFrom`, `dateTo` |

Current implementation note: payments are derived from completed trips with `paymentType = cash`.

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
Wallet endpoints are split between `wallets.public.routes.js` and `wallets.admin.routes.js`, mounted at both `/wallets` and `/admin/wallets`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallets/me` | customer / driver | Own wallet balance and details |
| GET | `/wallets/me/transactions` | customer / driver | Own paginated wallet transaction history |
| GET | `/admin/wallets` | admin | List all wallets (filterable by ownerType, search) |
| GET | `/admin/wallets/:id` | admin | Single wallet detail |
| GET | `/admin/wallets/:id/transactions` | admin | Transaction history for any wallet |
| POST | `/admin/wallets/:id/adjust` | admin | Credit or debit a wallet manually (logged as WalletTransaction) |

#### Notifications — `/api/v1/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | customer/driver | List own notifications (paginated) |
| PATCH | `/read-all` | customer/driver | Mark all as read |
| PATCH | `/:id/read` | customer/driver | Mark single notification as read |
| POST | `/device-token` | customer/driver | Register FCM device token. Body: `{ token, platform: ios\|android\|web }` |
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
- `POST /coupons/apply`: Apply a coupon to a searching customer trip
- Admin CRUD at `/api/v1/admin/promotions/coupons`

#### SOS — `/api/v1/sos`
- `POST /` — Submit SOS alert
- Admin SOS routes exist in `src/modules/sos/sos.admin.routes.js` but are not mounted in `src/app.js` currently.

#### Dashboard — `/api/v1/dashboard`
- `GET /statistics`: Admin-only dashboard summary
- `GET /ride-requests`: Publicly mounted dashboard ride request list
- `GET /rides/upcoming`: Publicly mounted upcoming rides list

#### Reports — `/api/v1/admin/reports`
- Ride stats, driver performance, user activity reports

See also: `PUBLIC_ENDPOINTS_DOCUMENTATION.md` for the current non-admin endpoint surface grouped by auth mode.

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
1. `POST /auth/register/user` with `name, email, phone, password, confirm_password`
2. Password hashed with bcrypt
3. `User` record created with `role: customer`
4. Wallet auto-created for the customer
5. Phone verification is handled client-side with Firebase Phone Auth
6. Client sends Firebase `id_token` to `POST /auth/otp/verify`
7. Existing phone number -> backend logs the user in
8. New phone number -> backend returns `requiresRegistration: true` with the verified phone number

### Driver Registration Flow
1. Register via `POST /auth/register/driver` with `name, email, phone, password, driving_license, vehicle_model, vin`
2. Driver account created as `User { role: driver, isVerified: false }`
3. Driver-specific fields are stored in `DriverProfile` (`drivingLicense`, `isOnline`, `rating`, `totalTrips`, `serviceId`)
4. Vehicle record created linked to the driver
5. Wallet created for the driver
6. Admin must verify driver (sets `isVerified: true`)
7. Driver service category is derived from selected vehicle model (`serviceId`)
8. Driver calls `POST /drivers/me/duty/start` to go online

### Current-State Update (rev 5)
- The current Trip pricing fields are `originalFare`, `discountAmount`, and `finalFare`
- `originalFare` is the raw calculated rider price before coupon discount
- `finalFare = originalFare - discountAmount`
- `driverEarnings` and `commission` are based on pre-discount pricing, not on `finalFare`
- Discounted trip completion credits a separate driver wallet transaction with reason `trip_coupon_reimbursement`
- Non-location realtime events are centralized in `emitRealtimeEvent()` inside `src/realtime/socket.js`
- Those events always emit Socket.io and send a matching FCM push with the same event name in the push payload
- `trip.driver_location` is the only socket event intentionally excluded from push notifications
- Private rider rooms are `user:{id}`; private driver rooms are `driver:{id}`; the availability broadcast room is `drivers:available`

### Ride Request Flow
```
1. Customer calls GET /trips/estimate → receives per-service pricing breakdown
2. Customer calls POST /trips → trip created with status `searching`
   - Service validated (must be active)
   - Pickup validated inside active region(s)
   - Pricing calculated (`originalFare`, `discountAmount`, `finalFare`, `commission`, `driverEarnings`)
   - Controller emits `emitTripRequest(io, trip, 10)` to nearby available drivers
3. Driver receives `trip.new_request`
4. Driver calls PATCH /drivers/me/trips/:id/accept → status `matched`
   - Customer receives `trip.driver_matched`
   - Other nearby drivers receive `trip.taken`
5. Driver calls PATCH /drivers/me/trips/:id/start → status `in_progress`
   - Both customer and driver receive `trip.status_changed`
6. During trip driver emits `driver.location_update`
   - Stored in `locationStore` (no DB write)
   - Forwarded as `trip.driver_location` to trip room subscribers
7. Driver calls PATCH /drivers/me/trips/:id/end → status `completed`
   - Driver stats/wallet settlement logic runs
   - Customer receives completion notification
8. Customer optionally rates trip via POST /trips/:id/rating
   - Driver average rating recalculated from `ratings`

Cancellation: Customer calls PATCH /trips/:id/cancel → status: cancelled
   - If a driver was matched, trip participants receive cancellation events/notifications
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
Current implementation note: the live Trip fields are `originalFare`, `discountAmount`, and `finalFare`, where `finalFare = originalFare - discountAmount`.

```
distanceKm     = haversine(pickupLat, pickupLng, dropoffLat, dropoffLng)
driverEarnings = distanceKm × FARE_PER_KM
commission     = calculateCommission(driverEarnings)
fixedSurcharge = service.fixedSurcharge
stopsSurcharge = stops.length × service.perStopSurcharge
originalFare   = driverEarnings + commission + fixedSurcharge + stopsSurcharge
finalFare      = originalFare - discountAmount
```
- `FARE_PER_KM` defaults to `5.0` (override via env var)
- `Service.baseFare` exists on the model but is currently not used in `calculateTripPricing()`
- Commission is added on top of driver earnings to produce `originalFare`
- Coupons reduce rider fare only; they do not reduce `driverEarnings` or `commission`
- Commission is DB-driven (see Commission System below)

### Coupon Application Flow
- Current field names: `originalFare`, `discountAmount`, `finalFare`
- Discount is calculated from `originalFare`, capped by `max_discount`, and stored on the trip
- Final trip fare becomes `finalFare = originalFare - discountAmount`
- `driverEarnings` and `commission` are unchanged by coupon application
- Once a coupon is applied to a trip, it cannot be changed; the rider must cancel and start over if they need a different coupon

- Customer calls `POST /promotions/coupons/apply` with `trip_id` and `code`
- Backend verifies the trip exists, belongs to the authenticated customer, and is still `searching`
- Backend rejects the request with `422` if a coupon is already attached to the trip
- Coupon validation checks: active, unexpired, global usage limit, per-rider limit, optional `min_amount`, and `coupon_type = new_users`
- Discount is calculated from `originalFare`, capped by `max_discount`, and stored on the trip
- Final trip fare becomes `finalFare = originalFare - discountAmount`
- `driverEarnings` and `commission` are unchanged by coupon application
- Coupon usage is recorded when the trip completes; canceled trips do not consume `used_count`

### Commission System
Commission rules are stored in the `CommissionRule` table and managed by admins.

**Rule selection priority:**
1. Active (`status = true`) global rule
2. Fallback: `COMMISSION_PCT` env var as a percentage (if no DB rules active)

**Rule types and config shapes:**

| type | config |
|---|---|
| `percentage` | `{ "pct": 15 }` |
| `fixed_amount` | `[{ "minFare": 0, "maxFare": 99.99, "amount": 5 }, { "minFare": 100, "maxFare": null, "amount": 10 }]` |
| `tiered_fixed` | Same array shape as `fixed_amount` |
| `tiered_percentage` | `[{ "minFare": 0, "maxFare": 100, "pct": 8 }, { "minFare": 100, "maxFare": null, "pct": 12 }]` |

**Activation rules:**
- New rules are always created with `status = false`
- Activating a rule via `PATCH /admin/commission-rules/:id/activate` runs an atomic transaction:
  1. Deactivates any currently active rule
  2. Activates the requested rule
- Only one rule can be active at any time

### Wallet Settlement on Trip Completion
When `PATCH /trips/:id/end` is called:

Current implementation note:
- `commission` and `driverEarnings` are based on `originalFare`, not `finalFare`
- Discounted trips add a separate wallet credit with reason `trip_coupon_reimbursement`
- The driver therefore keeps their normal payout basis even when the rider receives a coupon discount

| Payment type | Action | WalletTransaction reason |
|---|---|---|
| `cash` | Customer paid driver directly — **deduct `commission`** from driver wallet | `trip_commission_deduction` |

Settlement is skipped if `commission` or `driverEarnings` is null on the trip record. Every settlement is recorded atomically as a `WalletTransaction` (balance update + log entry in a single Prisma `$transaction`).

Current settlement note: when a coupon is applied, the backend also writes `trip_coupon_reimbursement` so the driver receives the discount value back separately from the normal trip settlement.

### Wallet Transaction Log
Current additional reason: `trip_coupon_reimbursement` for driver reimbursement on discounted trips.
Every balance change — whether from trip settlement, admin manual adjustment, or a refund — creates an immutable `WalletTransaction` record atomically with the balance update. This provides a full audit trail. The `reason` field distinguishes the source:
- `trip_commission_deduction` — cash trip settled, commission deducted from driver
- `trip_coupon_reimbursement` — coupon value reimbursed to driver on discounted completed trips
- `refund` — admin issued a refund to a user's wallet
- Any free-text string — admin manual adjustment via `POST /admin/wallets/:id/adjust`

### Refund Flow
Refund-like wallet credits currently happen through:
1. `POST /api/v1/users/:userId/refund` (admin) — credit a customer wallet
2. `POST /api/v1/admin/drivers/:driverId/refund` (admin) — credit a driver wallet
3. `POST /api/v1/drivers/me/trips/:tripId/credit-customer` (driver) — transfer from driver wallet to trip customer wallet

All flows create immutable `WalletTransaction` entries and update balances atomically.

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

### Phone Verification Flow
1. Client completes Firebase Phone Authentication and receives a Firebase ID token
2. Client calls `POST /auth/otp/verify` with body: `{ id_token }`
3. Backend verifies the ID token using Firebase Admin SDK (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
4. Backend ensures the token came from Firebase phone auth and extracts `phone_number`
5. If the phone number already exists:
   - backend marks the user verified if needed
   - backend issues Tovo `accessToken` + `refreshToken`
   - response includes `flow: "login"`
6. If the phone number does not exist:
   - backend does not create a user automatically
   - response includes `flow: "register"`, `requiresRegistration: true`, and the verified `phone`

**Important:** the backend no longer generates, stores, or sends SMS OTP codes for phone verification.

### Real-Time Location Tracking
- Driver GPS is stored in `locationStore` — a Node.js `Map` in process memory
- Updated via `driver.location_update` Socket.io event
- Entries older than `STALE_MS` (default 2 minutes) are lazily evicted on read and periodically cleaned every 30s
- `locationStore.getNearby(lat, lng, radiusKm, serviceId)` uses a bounding-box pre-filter for performance
- Used by realtime dispatch (`emitTripRequest`) and `GET /trips/nearby-drivers`

### Real-Time Notifications
- Existing non-location socket events are centralized in `emitRealtimeEvent()` in `src/realtime/socket.js`
- The helper always emits the socket event first, then sends a matching FCM push notification without checking whether the recipient is connected
- The push payload carries the same event name in both `event` and `type`, plus a serialized `payload`, so the Flutter client can suppress foreground notifications client-side
- Current non-location events handled this way: `trip.new_request`, `trip.driver_matched`, `trip.status_changed`, `trip.cancelled`, `trip.taken`, `trip.removed`
- `trip.driver_location` remains socket-only by design to avoid notification spam

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
| `FIREBASE_PROJECT_ID` | Firebase project ID | — (required for push + phone auth token verification) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | — (required for push + phone auth token verification) |
| `FIREBASE_PRIVATE_KEY` | Firebase private key (escaped `\n`) | — (required for push + phone auth token verification) |
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
Example stored filename: `avatar-1741427600000-482910372.jpg`. Avatar URLs returned by the API are always full URLs in the form `http(s)://<host>/uploads/<filename>`, constructed using `req.protocol` and `req.get('host')` in the controller — not relative paths. This applies to both `PATCH /drivers/me/avatar` and `PATCH /users/me/avatar`.

### Critical: Prisma Client Regeneration
**`npx prisma generate` must be re-run on the server after every schema change.** Skipping this causes `Cannot read properties of undefined (reading 'findFirst'|'findUnique'|...)` errors at runtime because the generated client is out of sync with `schema.prisma`. Always run `prisma generate` + `prisma migrate deploy` when deploying schema changes. On Windows, stop running Node processes first if Prisma's query engine DLL is locked during regeneration.

### Debug Endpoint
`GET /debug/locations` — Returns current in-memory driver location store (remove in production).

---

## 10. Future Extensions

### Known Pending Work
- **Legacy admin route aggregator remains commented**: `admin.routes.js` is still commented out in `app.js` while admin endpoints are mounted per-feature. Consider removing the unused aggregator file or fully adopting it to avoid confusion.
- **`regions.service.js` fix**: The `status` field must be cast to `Boolean` when creating a region — currently causes a Prisma type error when client sends `1` instead of `true`.
- **Admin authentication**: The admin module uses `authorize('admin')` but the JWT payload role needs to match. Admin login flow should be verified end-to-end.
- **Wallet top-up / driver withdrawal**: No endpoint exists for users to top up their wallet or drivers to request a payout. Requires payment gateway integration.
- **Prisma client regeneration required**: After the `PasswordResetToken` migration (`20260310171943_add_password_reset_tokens`) and previous `WalletTransaction` migration, run `npx prisma generate` with the server stopped to sync the generated client. Skipping this causes runtime errors on `prisma.passwordResetToken.*` / `prisma.walletTransaction.*` calls.
- **Client-side phone auth dependency**: mobile/web clients must complete Firebase Phone Authentication before calling `POST /auth/otp/verify`; the backend no longer sends SMS OTPs itself.

### Designed for Scalability
- **locationStore** can be replaced with Redis (same interface) for multi-instance deployments without code changes to the service layer
- **Repository pattern** makes it straightforward to swap Prisma for another ORM or add caching
- **Socket.io rooms** are already structured (`user:{id}`, `driver:{id}`, `trip:{id}`, `drivers:available`) for easy migration to Redis adapter
- **Module-per-feature** structure makes adding new domains (e.g., scheduled rides, surge pricing) isolated
- **Commission rules** are fully DB-driven — new rule types can be added without code changes by extending the `config` JSON shape

---

## Context Summary for AI Assistants
Current-state overrides for rev 6:
- Trip pricing field names are `originalFare`, `discountAmount`, and `finalFare`
- Driver settlement is based on pre-discount pricing and may include `trip_coupon_reimbursement`
- Driver-only schema fields live in `DriverProfile` (1:1 with `User`)
- Public/driver route surface is centered on `/api/v1/drivers` (admin at `/api/v1/admin/drivers`)
- Socket rooms are `user:{id}`, `driver:{id}`, `trip:{id}`, and `drivers:available`
- Existing non-location socket events now emit over Socket.io and send matching FCM pushes via `emitRealtimeEvent()`
- `trip.driver_location` remains socket-only
- Trip sharing is available through `POST /trips/:id/share-link` + `GET /trips/share/:token`
- Phone verification is now Firebase client-side; backend phone auth entrypoint is `POST /auth/otp/verify` with `{ id_token }`

Tovo is a Node.js/Express ride-hailing and package delivery backend using Prisma v5, MySQL, Socket.io, JWT auth, Firebase push notifications, Nodemailer, and Swagger at `/api/docs`. The codebase follows a Controller → Service → Repository structure, most features live in `src/modules/<name>/`, and auth sets `req.actor = { id, role }` for `customer`, `driver`, or `admin`.

Current trip pricing uses `originalFare`, `discountAmount`, and `finalFare`, where `finalFare = originalFare - discountAmount`. Commission rules are DB-driven, `driverEarnings` and `commission` are calculated from the pre-discount fare, coupon application is handled through `POST /api/v1/promotions/coupons/apply`, and discounted trip completion may write an extra wallet transaction with reason `trip_coupon_reimbursement`.

Realtime behavior uses `locationStore` for in-memory driver GPS and Socket.io rooms `user:{id}`, `driver:{id}`, `trip:{id}`, and `drivers:available`. Non-location trip events are centralized in `src/realtime/socket.js` and now emit both Socket.io events and matching FCM pushes, while `trip.driver_location` remains socket-only. `PUBLIC_ENDPOINTS_DOCUMENTATION.md` is the best current quick reference for mounted non-admin routes.

