# Tovo API — Modular Swagger Documentation

This directory contains the OpenAPI 3.0.3 specification for the **Tovo** ride-hailing API,
split into one folder per feature module for easy maintenance.

## Structure

```
swagger/
├── openapi.yaml              ← Root entry point (assembles all modules)
│
├── admins/
│   ├── paths.yaml            ← /admin/login, /admin/users, /admin/drivers, /admin/admins
│   └── schemas.yaml          ← AdminUser
│
├── analytics/
│   ├── paths.yaml            ← /admin/reports/rides|drivers|users
│   └── schemas.yaml          ← DriverReport, UserReport
│
├── auth/
│   ├── paths.yaml            ← /auth/register, /auth/login, /auth/logout, OTP, social
│   └── schemas.yaml          ← (references users/captains schemas)
│
├── captains/
│   ├── paths.yaml            ← /captains/me, duty, wallet, insurance, trips
│   └── schemas.yaml          ← Captain, DriverCreate, DriverUpdate
│
├── complaints/
│   ├── paths.yaml            ← /admin/complaints CRUD + respond/resolve
│   └── schemas.yaml          ← Complaint
│
├── coupons/
│   ├── paths.yaml            ← /promotions, /promotions/coupons/validate, /admin/promotions/coupons
│   └── schemas.yaml          ← Promotion
│
├── dashboard/
│   ├── paths.yaml            ← /dashboard/admin-dashboard
│   └── schemas.yaml          ← (inline responses)
│
├── faqs/
│   ├── paths.yaml            ← /faqs, /admin/faqs CRUD
│   └── schemas.yaml          ← Faq
│
├── locations/
│   ├── paths.yaml            ← /locations/search, nearby-captains, reverse-geocode
│   └── schemas.yaml          ← (no standalone schemas)
│
├── notifications/
│   ├── paths.yaml            ← /notifications, device-token, send-to-user/captain
│   └── schemas.yaml          ← Notification
│
├── payments/
│   ├── paths.yaml            ← /admin/payments, /admin/payments/{id}/refund
│   └── schemas.yaml          ← (PaymentMethod lives in users/schemas.yaml)
│
├── pricing/
│   ├── paths.yaml            ← /admin/pricing GET + PUT
│   └── schemas.yaml          ← (inline responses)
│
├── regions/
│   ├── paths.yaml            ← /admin/regions CRUD
│   └── schemas.yaml          ← Region
│
├── rides/
│   ├── paths.yaml            ← /admin/rides CRUD, refund, reassign, riderequest-list, upcoming
│   └── schemas.yaml          ← RefundRequest, RideStats
│
├── services/
│   ├── paths.yaml            ← /admin/services CRUD
│   └── schemas.yaml          ← Service
│
├── settings/
│   ├── paths.yaml            ← /admin/settings GET + PUT
│   └── schemas.yaml          ← SystemSetting
│
├── sos/
│   ├── paths.yaml            ← /sos, /admin/sos CRUD + handle
│   └── schemas.yaml          ← SosAlert
│
├── support/
│   ├── paths.yaml            ← /support/tickets CRUD + messages
│   └── schemas.yaml          ← SupportTicket
│
├── trips/
│   ├── paths.yaml            ← /trips estimate, create, list, details, cancel, rating
│   └── schemas.yaml          ← Trip, RideCreate, RideUpdate, Rating
│
├── users/
│   ├── paths.yaml            ← /users/me, avatar, wallet, addresses, payment-methods
│   └── schemas.yaml          ← User, UserCreate, UserUpdate, SavedAddress, PaymentMethod
│
├── vehicle-models/
│   ├── paths.yaml            ← /vehicle-models (public), /admin/vehicle-models CRUD
│   └── schemas.yaml          ← VehicleModel
│
├── vehicles/
│   ├── paths.yaml            ← /admin/vehicles CRUD
│   └── schemas.yaml          ← Vehicle, VehicleDetail
│
└── wallets/
    ├── paths.yaml            ← /admin/wallets list, get, adjust
    └── schemas.yaml          ← Wallet
```

## Usage

### Swagger UI / Redoc
Point your tool at `openapi.yaml`. Most modern tools (Swagger UI ≥ 4, Redoc, Stoplight)
support multi-file `$ref` resolution out of the box.

### Bundling into a single file
Use [swagger-cli](https://github.com/APIDevTools/swagger-cli) or [redocly](https://redocly.com/docs/cli/):

```bash
# swagger-cli
npx swagger-cli bundle openapi.yaml -o dist/openapi.bundle.yaml

# redocly
npx @redocly/cli bundle openapi.yaml -o dist/openapi.bundle.yaml
```

### Validation
```bash
npx @redocly/cli lint openapi.yaml
```
