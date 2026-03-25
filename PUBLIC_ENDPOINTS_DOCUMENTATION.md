# Tovo Backend Public Endpoints

## Purpose
This document is the current-state reference for non-admin endpoints that are actually exposed by the backend as of 2026-03-25.

It covers:
- Fully public endpoints with no authentication
- Customer-authenticated endpoints
- Driver-authenticated endpoints
- Shared authenticated endpoints on public paths

It does not include admin-only routes under `/api/v1/admin`.

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

## Public Endpoint Index

### 1. System

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/health` | public | Health check outside `/api/v1` |
| `GET` | `/uploads/:filename` | public | Static uploaded files |

### 2. Auth

Mounted at `/api/v1/auth`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/v1/auth/register/user` | public | Customer registration |
| `POST` | `/api/v1/auth/register/captain` | public | Driver registration |
| `POST` | `/api/v1/auth/login` | public | Customer or driver login |
| `POST` | `/api/v1/auth/token/refresh` | public | Refresh access token |
| `POST` | `/api/v1/auth/otp/send` | public | Send phone OTP |
| `POST` | `/api/v1/auth/otp/verify` | public | Verify phone OTP |
| `POST` | `/api/v1/auth/forgot-password` | public | Start forgot-password flow |
| `POST` | `/api/v1/auth/reset-password` | public | Complete forgot-password flow |
| `POST` | `/api/v1/auth/social` | public | Social login for customer or driver |
| `POST` | `/api/v1/auth/logout` | auth | Logout and optionally unregister device token |

### 3. Users

Mounted at `/api/v1/users`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | customer | Get rider profile |
| `PUT` | `/api/v1/users/me` | customer | Update rider profile |
| `PATCH` | `/api/v1/users/me/avatar` | customer | Upload rider avatar |
| `GET` | `/api/v1/users/me/wallet` | customer | Get rider wallet snapshot |
| `GET` | `/api/v1/users/me/addresses` | customer | List saved addresses |
| `POST` | `/api/v1/users/me/addresses` | customer | Create saved address |
| `PUT` | `/api/v1/users/me/addresses/:id` | customer | Update saved address |
| `DELETE` | `/api/v1/users/me/addresses/:id` | customer | Delete saved address |
| `GET` | `/api/v1/users/me/payment-methods` | customer | List payment methods |
| `POST` | `/api/v1/users/me/payment-methods` | customer | Add payment method |
| `DELETE` | `/api/v1/users/me/payment-methods/:id` | customer | Delete payment method |
| `PATCH` | `/api/v1/users/me/payment-methods/:id/default` | customer | Set default payment method |

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
| `POST` | `/api/v1/drivers/me/trips/:tripId/credit-customer` | driver | Credit customer wallet |

### 5. Trips

Mounted at `/api/v1/trips`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/trips/regions/active` | public | Active regions for trip placement |
| `GET` | `/api/v1/trips/estimate` | public | Fare estimate |
| `POST` | `/api/v1/trips` | customer | Create trip |
| `GET` | `/api/v1/trips` | customer | Customer trip history |
| `GET` | `/api/v1/trips/nearby-captains` | auth | Nearby available drivers |
| `GET` | `/api/v1/trips/captain/requests` | driver | Driver open trip requests |
| `GET` | `/api/v1/trips/captain/trips` | driver | Driver trip history |
| `GET` | `/api/v1/trips/captains/:captainId/ratings` | auth | Driver ratings |
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
| `GET` | `/api/v1/payments/:id` | customer | Get own payment detail |

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

### 14. FAQs

Mounted at `/api/v1/faqs`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/faqs` | public | Active FAQs |

### 15. SOS

Mounted at `/api/v1/sos`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/v1/sos` | auth | Submit SOS alert |

### 16. Settings

Mounted at `/api/v1/settings`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/settings` | public | Public settings map |

### 17. Current Public-Path Caveats

These endpoints are currently mounted on public paths and do not enforce admin auth in their route files.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/ride-requests` | public | Dashboard ride request list |
| `GET` | `/api/v1/dashboard/ride-requests/riderequest-list` | public | Legacy alias |
| `GET` | `/api/v1/dashboard/rides/upcoming` | public | Upcoming rides list |
| `GET` | `/api/v1/vehicles` | public | Vehicle list |
| `POST` | `/api/v1/vehicles` | public | Vehicle create route is publicly mounted today |
| `GET` | `/api/v1/vehicles/:id` | public | Vehicle detail |
| `PUT` | `/api/v1/vehicles/:id` | public | Vehicle update |
| `DELETE` | `/api/v1/vehicles/:id` | public | Vehicle delete |

Not included above:
- `GET /api/v1/dashboard/statistics` is not public; it requires admin auth.
- `/api/v1/admin/*` routes are intentionally excluded from this document.

---

**Last Updated:** 2026-03-25
**Source of Truth Used:** `src/app.js` and the currently mounted non-admin route files under `src/modules/`
