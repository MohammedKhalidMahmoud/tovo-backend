# Tovo Backend Admin API Design

## Purpose
This document is the current-state reference for admin-facing endpoints that are actually mounted in the backend as of 2026-03-24.

It replaces the older future-state admin panel spec with the endpoints that exist today in `src/app.js` and the route files mounted from there.

## Scope
- Primary admin base path: `/api/v1/admin`
- Admin auth entry point: `POST /api/v1/auth/admin/login`
- Extra admin-only endpoints also exist outside `/api/v1/admin`

## Authentication
- Standard admin endpoints use `Authorization: Bearer <admin_token>`
- Admin login endpoint:
  - `POST /api/v1/auth/admin/login`
- Most admin routes are protected with `authenticate + authorize('admin')`
- Important current exceptions:
  - `src/modules/vehicles/vehicles.routes.js` is mounted under both `/api/v1/vehicles` and `/api/v1/admin/vehicles` and currently does not apply auth middleware in the route file

## Response Shape
The codebase generally uses the shared response helpers in `src/utils/response.js`. In practice, successful responses commonly follow:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "pagination": {}
}
```

Error responses commonly follow:

```json
{
  "success": false,
  "message": "string"
}
```

## Admin Endpoint Index

### 1. Auth

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/auth/admin/login` | Admin login with `email` and `password` |

### 2. Users

Mounted at `/api/v1/admin/users` via `src/modules/users/users.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/users` | List users. Query: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`, `dateFrom`, `dateTo` |
| `POST` | `/api/v1/admin/users` | Create user |
| `GET` | `/api/v1/admin/users/:userId` | Get user detail |
| `PUT` | `/api/v1/admin/users/:userId` | Update user |
| `POST` | `/api/v1/admin/users/:userId/suspend` | Suspend or unsuspend user |
| `POST` | `/api/v1/admin/users/:userId/refund` | Refund to user wallet |
| `POST` | `/api/v1/admin/users/:userId/reset-password` | Reset user password |
| `DELETE` | `/api/v1/admin/users/:userId?confirm=true` | Delete user |

### 3. Drivers

Mounted at `/api/v1/admin/drivers` via `src/modules/drivers/drivers.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/drivers` | List drivers. Query: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`, `isVerified`, `onlineStatus` |
| `POST` | `/api/v1/admin/drivers` | Create driver |
| `GET` | `/api/v1/admin/drivers/:driverId` | Get driver detail |
| `PUT` | `/api/v1/admin/drivers/:driverId` | Update driver |
| `POST` | `/api/v1/admin/drivers/:driverId/approve` | Approve driver |
| `POST` | `/api/v1/admin/drivers/:driverId/reject` | Reject driver |
| `POST` | `/api/v1/admin/drivers/:driverId/suspend` | Suspend or unsuspend driver |
| `POST` | `/api/v1/admin/drivers/:driverId/refund` | Refund to driver |
| `POST` | `/api/v1/admin/drivers/:driverId/reset-password` | Reset driver password |
| `DELETE` | `/api/v1/admin/drivers/:driverId?confirm=true` | Delete driver |

### 4. Support

Mounted at `/api/v1/admin/support` via `src/modules/support/support.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/support` | List complaints/tickets. Query: `page`, `limit`, `status`, `type`, `search` |
| `GET` | `/api/v1/admin/support/:id` | Get complaint/ticket detail |
| `POST` | `/api/v1/admin/support/:id/respond` | Respond to complaint |
| `PATCH` | `/api/v1/admin/support/:id/resolve` | Resolve complaint |

### 5. Complaints

Mounted at `/api/v1/admin/complaints` via `src/modules/complaints/complaints.routes.js`.

This complaints module operates on the same underlying `SupportTicket` data, but exposes a complaints-specific admin path used by existing Swagger/docs and clients.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/complaints` | List complaints. Query: `page`, `limit`, `status` |
| `GET` | `/api/v1/admin/complaints/:id` | Get complaint detail |
| `POST` | `/api/v1/admin/complaints/:id/respond` | Respond to complaint |
| `PATCH` | `/api/v1/admin/complaints/:id` | Update complaint status |
| `POST` | `/api/v1/admin/complaints/:id/resolve` | Mark complaint as resolved |
| `DELETE` | `/api/v1/admin/complaints/:id` | Delete complaint |

### 6. Vehicle Models

Mounted at `/api/v1/admin/vehicle-models` via `src/modules/vehicle-models/vehicleModels.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/vehicle-models` | List all vehicle models |
| `GET` | `/api/v1/admin/vehicle-models/:id` | Get model detail |
| `POST` | `/api/v1/admin/vehicle-models` | Create model |
| `PUT` | `/api/v1/admin/vehicle-models/:id` | Update model |
| `DELETE` | `/api/v1/admin/vehicle-models/:id?confirm=true` | Delete model |

### 7. Regions

Mounted at `/api/v1/admin/regions` via `src/modules/regions/regions.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/regions` | List all regions |
| `POST` | `/api/v1/admin/regions` | Create region |
| `GET` | `/api/v1/admin/regions/:id` | Get region detail |
| `PUT` | `/api/v1/admin/regions/:id` | Update region |
| `DELETE` | `/api/v1/admin/regions/:id` | Delete region |

### 8. Services

Mounted at `/api/v1/admin/services` via `src/modules/services/services.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/services` | List all services, including inactive |
| `GET` | `/api/v1/admin/services/:id` | Get service detail |
| `POST` | `/api/v1/admin/services` | Create service |
| `PATCH` | `/api/v1/admin/services/:id` | Update service |
| `PATCH` | `/api/v1/admin/services/:id/image` | Update service image. Multipart field: `image` |
| `DELETE` | `/api/v1/admin/services/:id` | Delete service |

### 9. Payments

Mounted at `/api/v1/admin/payments` via `src/modules/payments/payments.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/payments` | List payments. Query: `page`, `limit`, `status`, `userId`, `driverId`, `paymentType`, `dateFrom`, `dateTo` |
| `GET` | `/api/v1/admin/payments/:id` | Get payment detail |
| `POST` | `/api/v1/admin/payments/:id/refund` | Refund card payment |

### 10. Promotions And Coupons

Mounted at `/api/v1/admin/promotions/coupons` via `src/modules/coupons/coupons.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/promotions/coupons` | List coupons. Query: `page`, `limit`, `status`, `search` |
| `POST` | `/api/v1/admin/promotions/coupons` | Create coupon |
| `GET` | `/api/v1/admin/promotions/coupons/:id` | Get coupon detail |
| `PUT` | `/api/v1/admin/promotions/coupons/:id` | Update coupon |
| `DELETE` | `/api/v1/admin/promotions/coupons/:id` | Delete coupon |

### 11. Commission Rules

Mounted at `/api/v1/admin/commission-rules` via `src/modules/commission-rules/commission-rules.routes.js`.

This is the current replacement for the old `/api/v1/admin/commissions` rules endpoints.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/commission-rules` | List rules |
| `GET` | `/api/v1/admin/commission-rules/:id` | Get rule detail |
| `POST` | `/api/v1/admin/commission-rules` | Create rule |
| `PATCH` | `/api/v1/admin/commission-rules/:id` | Update rule |
| `PATCH` | `/api/v1/admin/commission-rules/:id/activate` | Activate rule and atomically deactivate the previous active rule for the same `serviceId` |
| `DELETE` | `/api/v1/admin/commission-rules/:id` | Delete rule |

Supported rule types:
- `percentage`
- `fixed_amount`
- `tiered_fixed`
- `tiered_percentage`

### 12. Earnings

Mounted at `/api/v1/admin/earnings` via `src/modules/earnings/earnings.routes.js`.

This is the current replacement for the old `/api/v1/admin/commissions/earnings` endpoint.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/earnings` | List platform commission logs. Common filters: `dateFrom`, `dateTo`, `paymentType`, `serviceId`, `page`, `perPage` |

### 13. Settings

Mounted at `/api/v1/admin/settings` via `src/modules/settings/settings.routes.js`.

The same router is also mounted publicly at `/api/v1/settings`, but only the admin-only paths below are relevant for admin use.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/settings/all` | List all settings |
| `POST` | `/api/v1/admin/settings` | Create setting with `key` and `value` |
| `PATCH` | `/api/v1/admin/settings/:id` | Update setting |
| `DELETE` | `/api/v1/admin/settings/:id` | Delete setting |

Validation notes:
- `key` must match `^[a-z0-9_.]+$`
- `id` is a UUID

### 14. Wallets

Mounted at `/api/v1/admin/wallets` via `src/modules/wallets/wallets.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/wallets` | List wallets |
| `GET` | `/api/v1/admin/wallets/:id` | Get wallet detail |
| `GET` | `/api/v1/admin/wallets/:id/transactions` | Get wallet transactions |
| `POST` | `/api/v1/admin/wallets/:id/adjust` | Manual wallet adjustment |

### 15. Vehicles

Mounted at `/api/v1/admin/vehicles` via `src/modules/vehicles/vehicles.routes.js`.

Current implementation note: this route file is also mounted publicly at `/api/v1/vehicles`, and it currently does not apply auth middleware in the route file.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/vehicles` | List vehicles |
| `POST` | `/api/v1/admin/vehicles` | Create vehicle |
| `GET` | `/api/v1/admin/vehicles/:id` | Get vehicle detail |
| `PUT` | `/api/v1/admin/vehicles/:id` | Update vehicle |
| `DELETE` | `/api/v1/admin/vehicles/:id` | Delete vehicle |

## Admin-Only Endpoints Outside `/api/v1/admin`

### Dashboard

Mounted at `/api/v1/dashboard` via `src/modules/dashboard/dashboard.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/dashboard/admin-dashboard` | Admin dashboard summary. Protected by `authenticate + authorize('admin')` |

Implementation note:
- `GET /api/v1/dashboard/ride-requests/riderequest-list`
- `GET /api/v1/dashboard/rides/upcoming`

These dashboard routes also exist, but they are not currently admin-protected in the route file.

### Notifications

Mounted at `/api/v1/notifications` via `src/modules/notifications/notifications.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/notifications/send-to-user` | Manual push notification to a user. Admin-only |
| `POST` | `/api/v1/notifications/send-to-driver` | Manual push notification to a driver. Admin-only |

## Current Admin Surface Summary

### Mounted and usable now
- Auth admin login
- Users admin CRUD and actions
- Driver admin detail/actions, but no list endpoint
- Support admin ticket management
- Complaints admin management
- Regions admin CRUD
- Vehicle models admin CRUD
- Services admin CRUD
- Payments admin listing and refund
- Promotions/coupons admin CRUD
- Commission rules admin CRUD + activate
- Earnings listing
- Settings CRUD
- Wallets listing/detail/adjustment
- Vehicles CRUD
- Admin dashboard summary
- Admin notification send actions

### Not currently mounted as admin endpoints
These files or concepts exist in the repo/history but are not mounted in `src/app.js` right now:
- `src/modules/admin/admin.routes`
- `src/modules/faqs/faqs.admin.routes.js`
- `src/modules/sos/sos.admin.routes.js`
- `src/modules/analytics/analytics.routes.js`

### Renamed from older docs
- Old: `/api/v1/admin/commissions`
- New: `/api/v1/admin/commission-rules`

- Old: `/api/v1/admin/commissions/earnings`
- New: `/api/v1/admin/earnings`

## Notes For Future Updates
- Treat `src/app.js` as the source of truth for what is actually exposed
- If a route file exists but is not mounted in `src/app.js`, do not list it as a live admin endpoint
- If an endpoint is mounted under an admin path but lacks auth middleware, document that honestly until the implementation is fixed
- Keep this file aligned with `PROJECT_DOCUMENTATION.md` whenever admin modules are renamed or split

---

**Last Updated:** 2026-03-24
**Source of Truth Used:** `PROJECT_DOCUMENTATION.md`, `src/app.js`, and the currently mounted route files under `src/modules/`
