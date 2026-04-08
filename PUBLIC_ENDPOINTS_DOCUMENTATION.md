# Tovo Backend Public Endpoints

## Purpose
This document is the current-state reference for non-admin endpoints mounted by the backend as of 2026-04-08.

It covers:
- Fully public endpoints with no authentication
- Customer-authenticated endpoints
- Driver-authenticated endpoints
- Shared authenticated endpoints on public paths

It excludes:
- `/api/v1/admin/*` routes
- Admin-only endpoints mounted on non-admin paths such as `/api/v1/notifications/send-to-*`
- `POST /api/v1/auth/admin/login`

## Base Paths And Auth
- Main API base path: `/api/v1`
- Success responses usually follow:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

- Auth labels used below:
  - `public` = no token required
  - `auth` = any valid bearer token
  - `customer` = customer token required
  - `driver` = driver token required
  - `customer|driver` = either customer or driver token
  - `customer|admin` = customer or admin token

## Endpoint Index

### 1. System

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/health` | public | Health check outside `/api/v1` |
| `GET` | `/uploads/:filename` | public | Static uploaded files |
| `GET` | `/debug/locations` | public | Debug-only in-memory driver location snapshot |

### 2. Auth

Mounted at `/api/v1/auth`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/v1/auth/register/user` | public | Customer registration |
| `POST` | `/api/v1/auth/register/driver` | public | Driver registration |
| `POST` | `/api/v1/auth/login` | public | Customer or driver login |
| `POST` | `/api/v1/auth/token/refresh` | public | Refresh access token |
| `POST` | `/api/v1/auth/otp/verify` | public | Verify Firebase phone-auth `id_token` |
| `POST` | `/api/v1/auth/forgot-password` | public | Start forgot-password flow |
| `POST` | `/api/v1/auth/reset-password` | public | Complete forgot-password flow with `{ email, otp, new_password }` |
| `POST` | `/api/v1/auth/social` | public | Social login for customer or driver |
| `POST` | `/api/v1/auth/logout` | auth | Logout and optionally unregister device token |

### 3. Users

Mounted at `/api/v1/users`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | customer | Get rider profile |
| `PUT` | `/api/v1/users/me` | customer | Update rider profile |
| `PUT` | `/api/v1/users/me/email` | customer | Request email change verification |
| `PUT` | `/api/v1/users/me/password` | customer | Change password |
| `GET` | `/api/v1/users/email-change/verify` | public | Verify pending email change via token |
| `PATCH` | `/api/v1/users/me/avatar` | customer | Upload rider avatar |
| `GET` | `/api/v1/users/me/wallet` | customer | Get rider wallet snapshot |
| `GET` | `/api/v1/users/me/addresses` | customer | List saved addresses |
| `POST` | `/api/v1/users/me/addresses` | customer | Create saved address |
| `PUT` | `/api/v1/users/me/addresses/:id` | customer | Update saved address |
| `DELETE` | `/api/v1/users/me/addresses/:id` | customer | Delete saved address |

### 4. Drivers

Mounted at `/api/v1/drivers`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/drivers` | public | Public driver list |
| `GET` | `/api/v1/drivers/me` | driver | Get driver profile |
| `PUT` | `/api/v1/drivers/me` | driver | Update driver profile |
| `PATCH` | `/api/v1/drivers/me/avatar` | driver | Upload driver avatar |
| `POST` | `/api/v1/drivers/me/duty/start` | driver | Start duty |
| `POST` | `/api/v1/drivers/me/duty/end` | driver | End duty |
| `GET` | `/api/v1/drivers/me/wallet` | driver | Get driver wallet snapshot |
| `GET` | `/api/v1/drivers/me/insurance` | driver | List insurance cards |
| `GET` | `/api/v1/drivers/me/trips` | driver | Driver trip history |
| `PATCH` | `/api/v1/drivers/me/trips/:id/accept` | driver | Accept trip |
| `PATCH` | `/api/v1/drivers/me/trips/:id/decline` | driver | Decline trip |
| `PATCH` | `/api/v1/drivers/me/trips/:id/start` | driver | Start trip |
| `PATCH` | `/api/v1/drivers/me/trips/:id/end` | driver | Complete trip |
| `PATCH` | `/api/v1/drivers/me/trips/:id/stops/:stopId/arrive` | driver | Mark an intermediate stop as arrived |
| `POST` | `/api/v1/drivers/me/trips/:tripId/credit-customer` | driver | Credit customer wallet |

### 5. Trips

Mounted at `/api/v1/trips`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/trips/regions/active` | public | Active regions for trip placement |
| `GET` | `/api/v1/trips/estimate` | public | Route-aware fare estimate |
| `GET` | `/api/v1/trips/share/:token` | public | Shared trip view by token |
| `POST` | `/api/v1/trips` | customer | Create trip |
| `GET` | `/api/v1/trips` | customer | Customer trip history |
| `POST` | `/api/v1/trips/:id/stops` | customer | Add trip stops before trip start |
| `POST` | `/api/v1/trips/:id/share-link` | customer | Generate a trip share link |
| `GET` | `/api/v1/trips/nearby-drivers` | auth | Nearby available drivers |
| `GET` | `/api/v1/trips/driver/requests` | driver | Driver open trip requests |
| `GET` | `/api/v1/trips/driver/trips` | driver | Driver trip history |
| `GET` | `/api/v1/trips/drivers/:driverId/ratings` | auth | Driver ratings |
| `GET` | `/api/v1/trips/:id/route` | customer\|driver | Trip route polyline and decoded coordinates |
| `GET` | `/api/v1/trips/:id` | customer\|driver | Trip detail for involved actors |
| `PATCH` | `/api/v1/trips/:id/cancel` | customer | Cancel trip |
| `POST` | `/api/v1/trips/:id/rating` | customer | Rate completed trip |

### 6. Promotions And Coupons

Mounted at `/api/v1/promotions`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/promotions` | public | Active promotions and coupons |
| `POST` | `/api/v1/promotions/coupons/validate` | public | Validate coupon code |
| `POST` | `/api/v1/promotions/coupons/apply` | customer | Apply coupon to a searching trip |

Coupon application behavior:
- The trip must belong to the authenticated customer
- The trip must still be in `searching` status
- The trip fare is reduced, while `driverEarnings` and `commission` stay unchanged
- Only one coupon may be applied to a trip; a second apply attempt returns `422`
- Coupon usage is counted on trip completion

### 7. Notifications

Mounted at `/api/v1/notifications`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | auth | Notification inbox |
| `PATCH` | `/api/v1/notifications/read-all` | auth | Mark all notifications read |
| `PATCH` | `/api/v1/notifications/:id/read` | auth | Mark one notification read |
| `POST` | `/api/v1/notifications/device-token` | auth | Register device token |

### 8. Support

Mounted at `/api/v1/support`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/v1/support` | auth | Create support ticket |
| `GET` | `/api/v1/support` | auth | List own support tickets |
| `GET` | `/api/v1/support/:id` | auth | Get own support ticket detail |
| `POST` | `/api/v1/support/:id/messages` | auth | Add support ticket message |

### 9. Wallets

Mounted at `/api/v1/wallets`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/wallets/me` | customer\|driver | Get own wallet |
| `GET` | `/api/v1/wallets/me/transactions` | customer\|driver | Get own wallet transactions |

### 10. Payments

Mounted at `/api/v1/payments`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/payments/me` | customer | Get own payment history |
| `GET` | `/api/v1/payments/:id` | customer\|admin | Customer can view own payment; admin can view any |

### 11. Services

Mounted at `/api/v1/services`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/services` | public | Active services only |
| `GET` | `/api/v1/services/:id` | public | Active service detail |

### 12. Regions

Mounted at `/api/v1/regions`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/regions` | public | Active regions only |
| `GET` | `/api/v1/regions/:id` | public | Active region detail |

### 13. Vehicle Models

Mounted at `/api/v1/vehicle-models`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/vehicle-models` | public | Active vehicle models only |
| `GET` | `/api/v1/vehicle-models/:id` | public | Active vehicle model detail |

### 14. Vehicles

Mounted at `/api/v1/vehicles`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/vehicles/me` | driver | Get own vehicle details |

### 15. FAQs

Mounted at `/api/v1/faqs`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/faqs` | public | Active FAQs |
| `GET` | `/api/v1/faqs/:id` | public | Active FAQ detail |

### 16. Settings

Mounted at `/api/v1/settings`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/settings` | public | Public settings map |

## Admin-Only Endpoints Mounted Outside `/api/v1/admin`

These routes are on public-looking paths but still require admin auth:

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/notifications/send-to-user` | Manual push notification to a user |
| `POST` | `/api/v1/notifications/send-to-driver` | Manual push notification to a driver |
| `POST` | `/api/v1/notifications/send-to-audience` | Manual push notification to drivers, riders, or all |

## Not Mounted Right Now

- No `/api/v1/dashboard/*` routes are mounted
- No `/api/v1/sos` routes are mounted
- No user payment-method endpoints are mounted

---

**Last Updated:** 2026-04-08
**Source of Truth Used:** `src/app.js` and the currently mounted non-admin route files under `src/modules/`
