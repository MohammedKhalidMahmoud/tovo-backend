# Tovo Backend Admin API Design

## Purpose
This document is the current-state reference for admin-facing endpoints mounted by the backend as of 2026-04-08.

It reflects the routes actually wired in `src/app.js`, not older dashboard-era or future-state plans.

## Scope
- Primary admin base path: `/api/v1/admin`
- Admin auth entry point: `POST /api/v1/auth/admin/login`
- A few admin-only endpoints also exist outside `/api/v1/admin`

## Authentication
- Standard admin endpoints use `Authorization: Bearer <admin_token>`
- Admin login endpoint:
  - `POST /api/v1/auth/admin/login`
- Mounted admin routes are protected with `authenticate + authorize('admin')`
- Some routers are dual-mounted on both public and admin prefixes, but the route-level auth still enforces admin access where appropriate

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
| `POST` | `/api/v1/admin/drivers/:driverId/refund` | Refund to driver wallet |
| `POST` | `/api/v1/admin/drivers/:driverId/reset-password` | Reset driver password |
| `DELETE` | `/api/v1/admin/drivers/:driverId?confirm=true` | Delete driver |

### 4. Support

Mounted at `/api/v1/admin/support` via `src/modules/support/support.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/support` | List tickets. Query: `page`, `limit`, `status`, `type`, `search` |
| `GET` | `/api/v1/admin/support/:id` | Get ticket detail |
| `POST` | `/api/v1/admin/support/:id/respond` | Respond to ticket |
| `PATCH` | `/api/v1/admin/support/:id/resolve` | Resolve ticket |

### 5. FAQs

Mounted at `/api/v1/admin/faqs` via `src/modules/faqs/faqs.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/faqs` | List FAQs. Query: `page`, `limit`, `isActive`, `search` |
| `POST` | `/api/v1/admin/faqs` | Create FAQ |
| `GET` | `/api/v1/admin/faqs/:id` | Get FAQ detail |
| `PUT` | `/api/v1/admin/faqs/:id` | Update FAQ |
| `DELETE` | `/api/v1/admin/faqs/:id` | Delete FAQ |

### 6. Vehicle Models

Mounted at `/api/v1/admin/vehicle-models` via `src/modules/vehicle-models/vehicleModels.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/vehicle-models` | List all vehicle models |
| `GET` | `/api/v1/admin/vehicle-models/:id` | Get model detail |
| `POST` | `/api/v1/admin/vehicle-models` | Create model |
| `PUT` | `/api/v1/admin/vehicle-models/:id` | Update model |
| `DELETE` | `/api/v1/admin/vehicle-models/:id` | Delete model |

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

### 9. Toll Gates

Mounted at `/api/v1/admin/toll-gates` via `src/modules/toll-gates/tollGates.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/toll-gates` | List toll gates |
| `GET` | `/api/v1/admin/toll-gates/:id` | Get toll gate detail |
| `POST` | `/api/v1/admin/toll-gates` | Create toll gate |
| `PUT` | `/api/v1/admin/toll-gates/:id` | Update toll gate |
| `DELETE` | `/api/v1/admin/toll-gates/:id?confirm=true` | Delete toll gate |

### 10. Payments

Mounted at `/api/v1/admin/payments` via `src/modules/payments/payments.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/payments` | List payments. Query: `page`, `limit`, `status`, `userId`, `driverId`, `paymentType`, `dateFrom`, `dateTo` |
| `GET` | `/api/v1/admin/payments/:id` | Get payment detail |

### 11. Promotions And Coupons

Mounted at `/api/v1/admin/promotions/coupons` via `src/modules/coupons/coupons.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/promotions/coupons` | List coupons. Query: `page`, `limit`, `status`, `search` |
| `POST` | `/api/v1/admin/promotions/coupons` | Create coupon |
| `GET` | `/api/v1/admin/promotions/coupons/:id` | Get coupon detail |
| `PUT` | `/api/v1/admin/promotions/coupons/:id` | Update coupon |
| `DELETE` | `/api/v1/admin/promotions/coupons/:id` | Delete coupon |

Related public coupon flow:
- `POST /api/v1/promotions/coupons/apply` attaches a coupon to a customer trip
- Applied coupons reduce rider fare only; `driverEarnings` and `commission` stay unchanged
- `used_count` is incremented when the discounted trip completes
- Once a coupon is attached to a trip it cannot be replaced; a second apply attempt returns `422`

### 12. Commission Rules

Mounted at `/api/v1/admin/commission-rules` via `src/modules/commission-rules/commission-rules.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/commission-rules` | List rules |
| `GET` | `/api/v1/admin/commission-rules/:id` | Get rule detail |
| `POST` | `/api/v1/admin/commission-rules` | Create rule |
| `PATCH` | `/api/v1/admin/commission-rules/:id` | Update rule |
| `PATCH` | `/api/v1/admin/commission-rules/:id/activate` | Activate rule and deactivate any previously active rule |
| `DELETE` | `/api/v1/admin/commission-rules/:id` | Delete rule |

Supported rule types:
- `percentage`
- `fixed_amount`
- `tiered_fixed`
- `tiered_percentage`

### 13. Earnings

Mounted at `/api/v1/admin/earnings` via `src/modules/earnings/earnings.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/earnings` | List platform commission logs. Filters include `dateFrom`, `dateTo`, `paymentType`, `serviceId`, `page`, `perPage` |

### 14. Reports

Mounted at `/api/v1/admin/reports` via `src/modules/analytics/analytics.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/reports/rides` | Ride statistics report |
| `GET` | `/api/v1/admin/reports/drivers` | Driver performance report |
| `GET` | `/api/v1/admin/reports/users` | User activity report |

### 15. Settings

Mounted at `/api/v1/admin/settings` via `src/modules/settings/settings.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/settings/all` | List all settings |
| `POST` | `/api/v1/admin/settings` | Create setting with `key` and `value` |
| `PATCH` | `/api/v1/admin/settings/:id` | Update setting |
| `DELETE` | `/api/v1/admin/settings/:id` | Delete setting |

Validation notes:
- `key` must match `^[a-z0-9_.]+$`
- `id` is a UUID

### 16. Wallets

Mounted at `/api/v1/admin/wallets` via `src/modules/wallets/wallets.admin.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/wallets` | List wallets |
| `GET` | `/api/v1/admin/wallets/:id` | Get wallet detail |
| `GET` | `/api/v1/admin/wallets/:id/transactions` | Get wallet transactions |
| `POST` | `/api/v1/admin/wallets/:id/adjust` | Manual wallet adjustment |

### 17. Vehicles

Mounted at `/api/v1/admin/vehicles` via `src/modules/vehicles/vehicles.routes.js`.

This router is also mounted at `/api/v1/vehicles`, but admin CRUD routes still require admin auth at the route level.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/vehicles` | List vehicles |
| `POST` | `/api/v1/admin/vehicles` | Create vehicle |
| `GET` | `/api/v1/admin/vehicles/:id` | Get vehicle detail |
| `PUT` | `/api/v1/admin/vehicles/:id` | Update vehicle |
| `DELETE` | `/api/v1/admin/vehicles/:id` | Delete vehicle |

## Admin-Only Endpoints Outside `/api/v1/admin`

### Notifications

Mounted at `/api/v1/notifications` via `src/modules/notifications/notifications.routes.js`.

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/notifications/send-to-user` | Manual push notification to a user |
| `POST` | `/api/v1/notifications/send-to-driver` | Manual push notification to a driver |
| `POST` | `/api/v1/notifications/send-to-audience` | Manual push notification to drivers, riders, or all |

## Current Admin Surface Summary

### Mounted and usable now
- Auth admin login
- Users admin CRUD and account actions
- Driver admin CRUD and approval actions
- Support admin ticket management
- FAQ admin CRUD
- Regions admin CRUD
- Vehicle models admin CRUD
- Services admin CRUD
- Toll gates admin CRUD
- Payments admin listing and detail
- Promotions/coupons admin CRUD
- Commission rules admin CRUD plus activate
- Earnings listing
- Reports endpoints
- Settings CRUD
- Wallets listing, detail, transactions, and manual adjustment
- Vehicles admin CRUD
- Admin notification send actions

### Not currently mounted as admin endpoints
These files or concepts exist in the repo/history but are not mounted in `src/app.js` right now:
- `src/modules/admin/admin.routes`
- `src/modules/sos/sos.admin.routes.js`
- Any `/api/v1/dashboard/*` routes
- Any `/api/v1/admin/complaints` routes

### Renamed from older docs
- Old: `/api/v1/admin/commissions`
- New: `/api/v1/admin/commission-rules`

- Old: `/api/v1/admin/commissions/earnings`
- New: `/api/v1/admin/earnings`

## Notes For Future Updates
- Treat `src/app.js` as the source of truth for what is actually exposed
- Treat route-level middleware as the source of truth for access control on dual-mounted routers

---

**Last Updated:** 2026-04-08
