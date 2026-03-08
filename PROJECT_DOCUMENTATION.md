# Tovo Backend — Project Documentation

> Last updated: 2026-03-08
> Purpose: Persistent technical reference for developers and AI assistants continuing development across sessions.

---

## 1. Project Overview

### Purpose
Tovo is a **ride-hailing and package delivery** REST API backend. It connects riders (users) with drivers (captains) in real time, handles the full trip lifecycle, processes payments, and provides an admin interface for operations management.

### Main Features
- User and Captain registration, authentication (JWT + OTP)
- Real-time trip matching via Socket.io
- Fare estimation using haversine distance formula
- Service-area region validation (pickup must be inside a defined region)
- In-memory captain location tracking (zero DB writes for GPS)
- Wallet system for balance management, automatic trip settlement, and full transaction history log
- Payment methods (saved cards) + cash payment support
- Wallet refund system for card payments (admin-issued, with duplicate guard and transaction log)
- DB-driven commission rules with admin management panel
- Automatic captain wallet settlement on trip completion (cash vs card logic)
- Push notifications via Firebase Admin SDK
- SOS alerts from users or captains
- Support ticket system with threaded messages
- FAQ management
- Coupon/promotion system
- Admin analytics and dashboard
- Swagger/OpenAPI 3 documentation at `/api/docs`

### Target Users
| Role | Description |
|------|-------------|
| `user` | Riders booking trips |
| `captain` | Drivers accepting and fulfilling trips |
| `admin` | Operations team managing the platform |

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
  → Emitters called from controllers to push events to rooms
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
│   │   └── logger.js          # Winston logger
│   ├── middleware/
│   │   ├── auth.middleware.js # JWT authenticate + authorize(role)
│   │   ├── validate.middleware.js # express-validator error handler
│   │   └── error.middleware.js    # Global error handler
│   ├── realtime/
│   │   ├── socket.js          # Socket.io setup, event handlers, server emitters
│   │   └── locationStore.js   # In-memory Map for captain GPS (non-persistent)
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
Every module under `src/modules/<name>/` follows this pattern:

| File | Responsibility |
|------|---------------|
| `<name>.routes.js` | Route definitions, validation, auth middleware |
| `<name>.controller.js` | Extract params from req, call service, return response |
| `<name>.service.js` | Business logic, orchestration, cross-module calls |
| `<name>.repository.js` | All Prisma queries — only file that touches the DB |

**Rule:** Prisma is only ever accessed inside a repository file. Services never import `prisma` directly (except `trips.service.js` which has two legacy direct queries for rating aggregation and captain totalTrips increment — a known area for cleanup).

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
| `User` | `users` | Riders. Has wallet, saved addresses, payment methods, trips |
| `Captain` | `captains` | Drivers. Has vehicle, wallet, service assignment, online status |
| `Vehicle` | `vehicles` | One vehicle per captain. Links to VehicleModel |
| `VehicleModel` | `vehicle_models` | Make/model catalogue, linked to a Service |
| `Service` | `services` | Ride categories (e.g. Economy, Comfort). Has `baseFare` |
| `Trip` | `trips` | Core trip record with full lifecycle |
| `TripDecline` | `trip_declines` | Composite key `(tripId, captainId)` — tracks which captains declined |
| `Rating` | `ratings` | One per trip, user rates captain (1–5 stars) |
| `PaymentMethod` | `payment_methods` | Saved cards per user (visa, mastercard, apple_pay) |
| `Wallet` | `wallets` | Balance for user or captain. Credited/debited automatically on trip completion |
| `WalletTransaction` | `wallet_transactions` | Immutable log of every credit/debit on a wallet. Created atomically with every balance change |
| `CommissionRule` | `commission_rules` | DB-driven commission rules with type, config JSON, and per-service scoping |
| `Promotion` | `promotions` | Marketing banners/promotions |
| `Coupon` | `coupons` | Discount codes with usage limits and expiry |
| `SupportTicket` | `support_tickets` | Ticket raised by user or captain |
| `TicketMessage` | `ticket_messages` | Threaded messages inside a ticket |
| `Notification` | `notifications` | In-app notifications per user |
| `DeviceToken` | `device_tokens` | Firebase push tokens for users/captains |
| `Otp` | `otps` | OTP codes for phone verification |
| `RefreshToken` | `refresh_tokens` | Long-lived JWT refresh tokens |
| `Region` | `regions` | Circular service areas (lat, lng, radius in km) |
| `SosAlert` | `sos_alerts` | Emergency alerts from users or captains |
| `Faq` | `faqs` | Ordered FAQ entries |
| `InsuranceCard` | `insurance_cards` | Captain insurance documents |
| `SystemSetting` | `system_settings` | Key-value store for app-wide config. Fields: `id` (UUID), `key` (unique), `value` (string), `createdAt`, `updatedAt` |
| `AdminUser` | `admin_users` | Admin panel accounts (separate from users/captains) |

### Key Enums
- `Role`: `user | captain | admin`
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
1. User/Captain registers → password hashed with bcrypt → stored in DB
2. Login → server issues `accessToken` (JWT, short-lived) + `refreshToken` (long-lived)
3. All protected endpoints require `Authorization: Bearer <accessToken>`
4. `authenticate` middleware verifies token → attaches `req.actor = { id, role }`
5. `authorize('user')` etc. guard role access
6. Refresh via `POST /auth/refresh` with the refresh token

### Major Endpoints by Module

#### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register user or captain |
| POST | `/login` | — | Login, returns tokens |
| POST | `/refresh` | — | Exchange refresh token |
| POST | `/logout` | Bearer | Invalidate refresh token |

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

#### Trips — `/api/v1/trips`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/regions/active` | — | Active service regions (public) |
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
| PATCH | `/:id/accept` | captain | Accept trip |
| PATCH | `/:id/decline` | captain | Decline trip |
| PATCH | `/:id/start` | captain | Start trip |
| PATCH | `/:id/end` | captain | End trip + settle captain wallet |

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

#### Services — `/api/v1/services`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List active services |
| GET | `/:id` | — | Service details |
| POST | `/` | — | Create service |
| PATCH | `/:id` | — | Update service |

#### Regions — `/api/v1/regions` and `/api/v1/admin/regions`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all regions |
| POST | `/` | Create region |
| PATCH | `/:id` | Update region |
| DELETE | `/:id` | Delete region |

#### Payments — `/api/v1/payments` and `/api/v1/admin/payments`
Both paths served by the same router (`payments.routes.js`). Auth enforced per route inline.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/payments/me` | user | Own payment history (completed trips only) |
| GET | `/payments/:id` | user / admin | Single payment detail — users can only access their own |
| GET | `/admin/payments` | admin | All payments, filterable by `userId`, `driverId`, `paymentType`, `dateFrom`, `dateTo` |
| POST | `/admin/payments/:id/refund` | admin | Issue wallet refund for a card payment — guards: trip must be `completed`, type must be `card`, amount ≤ fare, no duplicate refund. Creates a `WalletTransaction` atomically |

#### Support — `/api/v1/support`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | any | Create ticket |
| GET | `/` | any | List own tickets |
| GET | `/:id` | any | Ticket detail |
| POST | `/:id/messages` | any | Add message to ticket |

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
- `GET /` — List own notifications
- `PATCH /:id/read` — Mark as read

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

### Captain Registration Flow
1. Register same as user but with `role: captain` + `drivingLicense`
2. Captain starts as `isVerified: false`, `isOnline: false`
3. Admin manually verifies captain (sets `isVerified: true`)
4. Captain must register a vehicle (`POST /captains/me/vehicle`)
5. Captain chooses a service category (`serviceId` on captain record)
6. Captain calls `POST /captains/duty/start` to go online

### Ride Request Flow
```
1. User calls GET /trips/estimate  →  receives fare + commission + driverEarnings breakdown
2. User calls POST /trips          →  trip created with status: searching
   - Service validated (active)
   - Pickup validated inside an active Region (haversine check)
   - fare = baseFare + distanceKm × FARE_PER_KM
   - commission + driverEarnings calculated via commission rules (see below)
   - Nearby online captains found from in-memory locationStore
   - Each nearby captain receives 'trip.new_request' via Socket.io

3. Captain receives 'trip.new_request' event
4. Captain calls PATCH /trips/:id/accept → status: matched
   - User receives 'trip.captain_matched' via Socket.io
   - Other captains receive 'trip.taken' (removed from their list)

5. Captain calls PATCH /trips/:id/start  → status: in_progress
   - Both user and captain receive 'trip.status_changed'

6. During trip: Captain emits 'captain.location_update' via Socket.io
   - Stored in locationStore (no DB write)
   - Forwarded to trip room: user sees live captain position

7. Captain calls PATCH /trips/:id/end   → status: completed
   - Captain's totalTrips incremented
   - Captain wallet settled (see Wallet Settlement below)

8. User calls POST /trips/:id/rating    → Rating created
   - Captain's average rating recalculated
```

### Captain Decline Flow
- Captain calls `PATCH /trips/:id/decline`
- A `TripDecline` record is created for `(tripId, captainId)`
- `GET /trips/captain/requests` filters out trips with this captain's decline
- Other captains still see the trip (upsert prevents duplicate declines)

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
| `cash` | Passenger paid captain directly — **deduct `commission`** from captain wallet | `trip_commission_deduction` |
| `card` | Platform received payment — **credit `driverEarnings`** to captain wallet | `trip_earnings_credit` |

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

On success: user wallet balance incremented + `WalletTransaction { type: credit, reason: refund }` created atomically.

### Real-Time Location Tracking
- Captain GPS is stored in `locationStore` — a Node.js `Map` in process memory
- Updated via `captain.location_update` Socket.io event
- Entries older than `STALE_MS` (default 2 minutes) are lazily evicted on read and periodically cleaned every 30s
- `locationStore.getNearby(lat, lng, radiusKm, serviceId)` uses a bounding-box pre-filter for performance
- Used by `POST /trips` to find captains to notify, and by `GET /trips/nearby-captains`

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
| Firebase credentials | Firebase Admin SDK config | — (required for push) |

### Important Config Files
- `prisma/schema.prisma` — Single source of truth for the database schema
- `swagger/swagger.config.js` — Merges all YAML swagger files at startup
- `swagger/swagger.info.yaml` — Server URLs (local + production)
- `src/config/prisma.js` — Singleton Prisma client (import from here everywhere)
- `src/config/logger.js` — Winston logger instance

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
- **Prisma client regeneration required**: After the `WalletTransaction` migration (`20260308101042_add_wallet_transactions`), run `npx prisma generate` with the server stopped to sync the generated client. Skipping this causes runtime errors on `prisma.walletTransaction.*` calls.

### Designed for Scalability
- **locationStore** can be replaced with Redis (same interface) for multi-instance deployments without code changes to the service layer
- **Repository pattern** makes it straightforward to swap Prisma for another ORM or add caching
- **Socket.io rooms** are already structured (`user:{id}`, `captain:{id}`, `trip:{id}`) for easy migration to Redis adapter
- **Module-per-feature** structure makes adding new domains (e.g., scheduled rides, surge pricing) isolated
- **Commission rules** are fully DB-driven — new rule types can be added without code changes by extending the `config` JSON shape

---

## Context Summary for AI Assistants

Tovo is a Node.js/Express ride-hailing and package delivery backend. Stack: Express 4, Prisma ORM v5, MySQL, Socket.io, JWT auth, Firebase push notifications, Swagger/OpenAPI docs at `/api/docs`. The project is backend-only with no frontend. Architecture is strictly layered: **Controller → Service → Repository** — only repositories access Prisma. Auth middleware sets `req.actor = { id, role }` (not `req.user`). Three roles: `user` (riders), `captain` (drivers), `admin`. All modules live under `src/modules/<name>/` with four files each: routes, controller, service, repository. Swagger docs are loaded from YAML files in `swagger/<module>/paths.yaml` and merged in `swagger/swagger.config.js`. Swagger server URLs: local = `http://localhost:3000/api/v1`, production = `https://tovo-b.developteam.site/api/v1`. Real-time captain GPS is stored in an in-memory `locationStore` (never written to DB); Socket.io rooms are `user:{id}`, `captain:{id}`, `trip:{id}`, `captains:available`. Trip lifecycle states: `searching → matched → on_way → in_progress → completed | cancelled`. Fare = `driverEarnings + commission` (what passenger pays). `driverEarnings = distanceKm × FARE_PER_KM`. Commission is **added on top** of driverEarnings via DB-driven `CommissionRule` records — NOT deducted from fare. `Service.baseFare` exists on the model but is not used in the current calculation. Captain wallet is automatically settled on `endTrip`: cash trips deduct commission (`reason: trip_commission_deduction`), card trips credit driverEarnings (`reason: trip_earnings_credit`). Every wallet balance change (trip settlement, admin adjust, refund) creates a `WalletTransaction` record atomically via Prisma `$transaction`. Commission rules are managed at `/api/v1/admin/commissions`; activate endpoint atomically swaps the active rule per service. Fallback when no active rule: `COMMISSION_PCT` env var as percentage. Trips store `paymentType` (`cash`/`card`), `commission`, and `driverEarnings` as explicit columns. Wallets module is at `src/modules/wallets/` — routes mounted at both `/api/v1/wallets` (user/captain) and `/api/v1/admin/wallets` (admin); auth is enforced inline per route. `adjustCaptainWallet(captainId, delta, { reason, tripId })` in `wallets.repository.js` now accepts a reason and tripId to log the transaction. Payments module is at `src/modules/payments/` — has a `payments.repository.js`. Refund endpoint guards: trip completed, card payment only, amount ≤ fare, no duplicate (checked via `WalletTransaction` with `reason: refund` for same `tripId`). Helmet is bypassed for `/api/docs` to allow Swagger UI cross-origin requests; all other routes use `crossOriginResourcePolicy: cross-origin`. Response utility is at `src/utils/response.js` and exports `success, created, error, notFound, paginate`. Middleware paths are always `../../middleware/` from inside a module. The `regionstRoutes` variable in `app.js` is a typo duplicate of `regionsRoutes` — both point to the same file and can be ignored. Settings module is fully implemented: `settings.routes.js` (single file for public + admin routes), `settings.controller.js`, `settings.service.js`, `settings.repository.js`. Public `GET /settings` returns a flat `{ key: value }` map; admin routes are protected by inline `authenticate + authorize('admin')` and mounted at `/api/v1/admin/settings`. The `SystemSetting` model uses a UUID `id` primary key with `key` as a unique field — value is always stored as a plain string (client parses type). Avatar uploads use `multer.diskStorage` with a custom `filename` function that preserves the original file extension (`path.extname(file.originalname)`) — produces filenames like `avatar-1741427600000-482910372.jpg`. The `uploads/` directory is served as static files. Avatar URLs are always full backend URLs built with `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`. Seed file (`prisma/seed.js`) includes: 3 users, 3 captains, 1 admin, 4 services, 8 vehicle models, 3 vehicles, 6 wallets, 3 coupons (WELCOME50 active, TOVO2025 expired Jan 2026, EXPIRED10 inactive), 4 trips (completed/cancelled/on_way/searching), 12 FAQs, 12 system settings. Always run `npx prisma generate` + `npx prisma migrate deploy` after any schema change on the server, or Prisma model accessors will be undefined at runtime. The `WalletTransaction` migration name is `20260308101042_add_wallet_transactions`.
