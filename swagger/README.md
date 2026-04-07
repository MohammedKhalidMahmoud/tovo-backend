# Tovo Swagger Modules

This directory contains modular OpenAPI source files used by `swagger/swagger.config.js` to build the runtime docs served by the app:

- `GET /api/docs` (combined spec)
- `GET /docs/public` (public-only filtered view)
- `GET /docs/admin` (admin-only filtered view)

## How It Is Built

`swagger/swagger.config.js` loads:

- `swagger/swagger.info.yaml` for base OpenAPI metadata
- every module `schemas.yaml`
- every module `paths.yaml`

Then it merges them into one `paths` object and one `components.schemas` object.

## Current Modules

- `analytics`
- `auth`
- `commission-rules`
- `coupons`
- `dashboard`
- `drivers`
- `earnings`
- `faqs`
- `notifications`
- `payments`
- `regions`
- `services`
- `settings`
- `support`
- `toll-gates`
- `trips`
- `users`
- `vehicle-models`
- `vehicles`
- `wallets`

## Notes

- `rides/` exists in the repository for historical reference, but it is **not loaded** by `swagger.config.js`.
- Public routes should explicitly set `security: []` in path definitions when they do not require authentication.
