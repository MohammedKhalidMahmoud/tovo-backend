# Admin API Simple Documentation

Base URL: `/api/v1`

## Authentication

- Login endpoint: `POST /auth/admin/login`
- All admin endpoints require `Authorization: Bearer <admin_jwt>` unless noted otherwise.
- A few admin-only endpoints do not start with `/admin/...` and are listed under `Special Admin Endpoints` below.
- Response style is generally:
  - Success: `200` or `201` with `{ success: true, message?, data? }`
  - Failure: `400` validation error, `401` unauthorized, `403` forbidden, `404` not found, `409` conflict, `422` business-rule failure

## Auth

### `POST /auth/admin/login`
- Purpose: Admin login and token issuance.
- Request body: `email`, `password`.
- Success: `200` with admin profile/tokens.
- Fail: `400` invalid input, `401` invalid credentials.

## Users

### `GET /admin/users`
- Purpose: List users.
- Request body: None.
- Success: `200` with paginated/filterable user list.
- Fail: `400` invalid query params, `401` unauthorized, `403` admin required.

### `POST /admin/users`
- Purpose: Create user.
- Request body: Usually `name`, `email`; may also include `phone`, `password`, `language`.
- Success: `201` with created user.
- Fail: `400` validation error, `401` unauthorized, `403` admin required, `409` email already exists.

### `GET /admin/users/{id}`
- Purpose: Get user details.
- Request body: None.
- Success: `200` with user details.
- Fail: `400` invalid id, `401`, `403`, `404`.

### `PATCH /admin/users/{id}`
- Purpose: Update user status/details.
- Request body: Partial update fields such as `isSuspended`, `notes`.
- Success: `200` with updated user.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/users/{id}`
- Purpose: Replace/update user.
- Request body: Full or broader user update payload.
- Success: `200` with updated user.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/users/{id}`
- Purpose: Delete user.
- Request body: Usually none. May require `confirm=true` in query; some variants also allow optional reason.
- Success: `200` with deletion confirmation.
- Fail: `400`, `401`, `403`, `404`.

### `GET /admin/users/{userId}`
- Purpose: Get user details.
- Request body: None.
- Success: `200` with user details.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/users/{userId}`
- Purpose: Update user.
- Request body: User fields such as `name`, `email`, `phone`, `language`, `notificationsEnabled`.
- Success: `200` with updated user.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/users/{userId}`
- Purpose: Delete user.
- Request body: Usually none. May include optional `reason`; often requires `confirm=true` query param.
- Success: `200` with deletion confirmation.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/users/{userId}/suspend`
- Purpose: Suspend or unsuspend user.
- Request body: `action` (`suspend` or `unsuspend`), optional `reason`, optional `durationDays`.
- Success: `200` with updated user suspension state.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/users/{userId}/refund`
- Purpose: Refund to user wallet.
- Request body: `amount`, `currency`, `reason`, optional `tripId`, optional `notes`.
- Success: `200` with updated wallet or refund result.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/users/{userId}/reset-password`
- Purpose: Reset user password.
- Request body: `newPassword`.
- Success: `200` with confirmation message.
- Fail: `400`, `401`, `403`, `404`.

## Drivers

### `GET /admin/drivers`
- Purpose: List drivers.
- Request body: None.
- Success: `200` with driver list.
- Fail: `400`, `401`, `403`.

### `POST /admin/drivers`
- Purpose: Create driver.
- Request body: Driver profile/auth fields; exact payload depends on module implementation.
- Success: `201` with created driver.
- Fail: `400`, `401`, `403`, `409`.

### `GET /admin/drivers/{driverId}`
- Purpose: Get driver details.
- Request body: None.
- Success: `200` with driver details.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/drivers/{driverId}`
- Purpose: Update driver.
- Request body: Driver profile/status fields.
- Success: `200` with updated driver.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/drivers/{driverId}`
- Purpose: Delete driver.
- Request body: Usually none.
- Success: `200` with deletion confirmation.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/drivers/{driverId}/approve`
- Purpose: Approve driver.
- Request body: Usually none or optional approval metadata.
- Success: `200` with approved driver state.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/drivers/{driverId}/reject`
- Purpose: Reject driver.
- Request body: Usually rejection `reason` or notes.
- Success: `200` with rejection confirmation.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/drivers/{driverId}/suspend`
- Purpose: Suspend or unsuspend driver.
- Request body: Action/reason style payload depending on implementation.
- Success: `200` with updated driver state.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/drivers/{driverId}/refund`
- Purpose: Refund to driver wallet.
- Request body: Refund amount/reason payload.
- Success: `200` with refund result.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/drivers/{driverId}/reset-password`
- Purpose: Reset driver password.
- Request body: New password payload.
- Success: `200` with confirmation.
- Fail: `400`, `401`, `403`, `404`.

## Vehicles

### `GET /admin/vehicles`
- Purpose: List vehicles.
- Request body: None.
- Success: `200` with vehicle list.
- Fail: `400`, `401`, `403`.

### `POST /admin/vehicles`
- Purpose: Create vehicle.
- Request body: Vehicle fields such as brand/model/plate/service linkage depending on implementation.
- Success: `201` with created vehicle.
- Fail: `400`, `401`, `403`, `409`.

### `GET /admin/vehicles/{id}`
- Purpose: Get vehicle details.
- Request body: None.
- Success: `200` with vehicle details.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/vehicles/{id}`
- Purpose: Update vehicle.
- Request body: Vehicle update fields.
- Success: `200` with updated vehicle.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/vehicles/{id}`
- Purpose: Delete vehicle.
- Request body: Usually none.
- Success: `200` with deletion confirmation.
- Fail: `400`, `401`, `403`, `404`.

## Vehicle Models

### `GET /admin/vehicle-models`
- Purpose: List vehicle models.
- Request body: None.
- Success: `200` with model list.
- Fail: `401`, `403`.

### `POST /admin/vehicle-models`
- Purpose: Create vehicle model.
- Request body: `name`, `brand`, optional `description`, optional `imageUrl`, optional `serviceId`, optional `isActive`.
- Success: `201` with created model.
- Fail: `400`, `401`, `403`, `409`.

### `GET /admin/vehicle-models/{id}`
- Purpose: Get vehicle model details.
- Request body: None.
- Success: `200` with model details.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/vehicle-models/{id}`
- Purpose: Update vehicle model.
- Request body: Any editable model fields such as `name`, `brand`, `description`, `imageUrl`, `serviceId`, `isActive`.
- Success: `200` with updated model.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/vehicle-models/{id}`
- Purpose: Delete vehicle model.
- Request body: Usually none. Often requires `confirm=true` query param.
- Success: `200` with deletion confirmation.
- Fail: `400`, `401`, `403`, `404`.

## Services

### `GET /admin/services`
- Purpose: List services.
- Request body: None.
- Success: `200` with service list.
- Fail: `401`, `403`.

### `POST /admin/services`
- Purpose: Create service.
- Request body: `name`, optional `baseFare`, optional `isActive`.
- Success: `201` with created service.
- Fail: `400`, `401`, `403`, `409`.

### `GET /admin/services/{id}`
- Purpose: Get service details.
- Request body: None.
- Success: `200` with service details.
- Fail: `400`, `401`, `403`, `404`.

### `PATCH /admin/services/{id}`
- Purpose: Update service.
- Request body: Partial service fields such as `name`, `baseFare`, `isActive`.
- Success: `200` with updated service.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/services/{id}`
- Purpose: Delete service.
- Request body: None.
- Success: `200` with deletion confirmation.
- Fail: `401`, `403`, `404`.

### `PATCH /admin/services/{id}/image`
- Purpose: Update service image.
- Request body: `multipart/form-data` with `image`.
- Success: `200` with updated image URL.
- Fail: `400` no file/validation issue, `401`, `403`, `404`.

## Regions

### `GET /admin/regions`
- Purpose: List regions.
- Request body: None.
- Success: `200` with paginated/filterable region list.
- Fail: `400`, `401`, `403`.

### `POST /admin/regions`
- Purpose: Create region.
- Request body: Region fields such as `name`, `city`, `lat`, `lng`, `radius`, `status`.
- Success: `201` with created region.
- Fail: `400`, `401`, `403`.

### `GET /admin/regions/{id}`
- Purpose: Get region details.
- Request body: None.
- Success: `200` with region details.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/regions/{id}`
- Purpose: Update region.
- Request body: Editable region fields such as `name`, `country`, `city`, `lat`, `lng`, `radius`, `isActive` or `status`.
- Success: `200` with updated region.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/regions/{id}`
- Purpose: Delete region.
- Request body: None.
- Success: `200` with deletion confirmation.
- Fail: `401`, `403`, `404`.

## Payments

### `GET /admin/payments`
- Purpose: List payments.
- Request body: None.
- Success: `200` with paginated/filterable payment list.
- Fail: `400`, `401`, `403`.

### `POST /admin/payments/{id}/refund`
- Purpose: Refund payment.
- Request body: `amount`, `reason`.
- Success: `200` with refund result.
- Fail: `400`, `401`, `403`, `404`, `409`, `422`.

## Wallets

### `GET /admin/wallets`
- Purpose: List wallets.
- Request body: None.
- Success: `200` with wallet list.
- Fail: `400`, `401`, `403`.

### `GET /admin/wallets/{id}`
- Purpose: Get wallet details.
- Request body: None.
- Success: `200` with wallet details.
- Fail: `400`, `401`, `403`, `404`.

### `GET /admin/wallets/{id}/transactions`
- Purpose: Get wallet transactions.
- Request body: None.
- Success: `200` with paginated transaction history.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/wallets/{id}/adjust`
- Purpose: Manually adjust wallet balance.
- Request body: Typically `type`/`amount`/`reason` style payload.
- Success: `200` with updated wallet/transaction result.
- Fail: `400`, `401`, `403`, `404`.

## Commission Rules

### `GET /admin/commissions`
- Purpose: List commission rules.
- Request body: None.
- Success: `200` with rule list.
- Fail: `401`, `403`.

### `POST /admin/commissions`
- Purpose: Create commission rule.
- Request body: Rule fields such as `name`, `type`, `config`, optional `serviceId`, optional `status`.
- Success: `201` with created rule.
- Fail: `400`, `401`, `403`, `409`.

### `GET /admin/commissions/{id}`
- Purpose: Get commission rule.
- Request body: None.
- Success: `200` with rule details.
- Fail: `400`, `401`, `403`, `404`.

### `PATCH /admin/commissions/{id}`
- Purpose: Update commission rule.
- Request body: Partial rule fields such as `name`, `type`, `config`, `serviceId`.
- Success: `200` with updated rule.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/commissions/{id}`
- Purpose: Delete commission rule.
- Request body: None.
- Success: `200` with deletion confirmation.
- Fail: `401`, `403`, `404`.

### `PATCH /admin/commissions/{id}/activate`
- Purpose: Activate commission rule.
- Request body: None.
- Success: `200` with activated rule.
- Fail: `400`, `401`, `403`, `404`, `409`.

## Promotions / Coupons

### `GET /admin/promotions/coupons`
- Purpose: List coupons.
- Request body: None.
- Success: `200` with coupon list.
- Fail: `400`, `401`, `403`.

### `POST /admin/promotions/coupons`
- Purpose: Create coupon.
- Request body: Coupon fields such as code, discount config, dates, usage rules.
- Success: `201` with created coupon.
- Fail: `400`, `401`, `403`, `409`.

### `GET /admin/promotions/coupons/{id}`
- Purpose: Get coupon details.
- Request body: None.
- Success: `200` with coupon details.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/promotions/coupons/{id}`
- Purpose: Update coupon.
- Request body: Editable coupon fields.
- Success: `200` with updated coupon.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/promotions/coupons/{id}`
- Purpose: Delete coupon.
- Request body: None.
- Success: `200` with deletion confirmation.
- Fail: `401`, `403`, `404`.

## Support

### `GET /admin/support`
- Purpose: List support tickets.
- Request body: None.
- Success: `200` with paginated/filterable ticket list.
- Fail: `400`, `401`, `403`.

### `GET /admin/support/{id}`
- Purpose: Get support ticket.
- Request body: None.
- Success: `200` with ticket details.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/support/{id}/respond`
- Purpose: Respond to support ticket.
- Request body: `response`.
- Success: `200` with updated ticket/response confirmation.
- Fail: `400`, `401`, `403`, `404`.

### `PATCH /admin/support/{id}/resolve`
- Purpose: Resolve support ticket.
- Request body: None.
- Success: `200` with resolved ticket state.
- Fail: `400`, `401`, `403`, `404`.

## Complaints

### `GET /admin/complaints`
- Purpose: List complaints.
- Request body: None.
- Success: `200` with complaint list.
- Fail: `400`, `401`, `403`.

### `GET /admin/complaints/{id}`
- Purpose: Get complaint details.
- Request body: None.
- Success: `200` with complaint details.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/complaints/{id}/respond`
- Purpose: Respond to complaint.
- Request body: Typically `response`.
- Success: `200` with updated complaint/response.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/complaints/{id}/resolve`
- Purpose: Resolve complaint.
- Request body: Usually none.
- Success: `200` with resolved complaint state.
- Fail: `400`, `401`, `403`, `404`.

## Settings

### `GET /admin/settings/all`
- Purpose: List all settings.
- Request body: None.
- Success: `200` with all setting records.
- Fail: `401`, `403`.

### `POST /admin/settings`
- Purpose: Create setting.
- Request body: `key`, `value`.
- Success: `201` with created setting.
- Fail: `400`, `401`, `403`, `409`.

### `PATCH /admin/settings/{id}`
- Purpose: Update setting.
- Request body: `key?`, `value?`.
- Success: `200` with updated setting.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/settings/{id}`
- Purpose: Delete setting.
- Request body: None.
- Success: `200` with deletion confirmation.
- Fail: `401`, `403`, `404`.

## Reports

### `GET /admin/reports/rides`
- Purpose: Ride reports.
- Request body: None.
- Success: `200` with ride report data.
- Fail: `400`, `401`, `403`.

### `GET /admin/reports/drivers`
- Purpose: Driver reports.
- Request body: None.
- Success: `200` with driver report data.
- Fail: `400`, `401`, `403`.

### `GET /admin/reports/users`
- Purpose: User reports.
- Request body: None.
- Success: `200` with user report data.
- Fail: `400`, `401`, `403`.

## Rides

### `GET /admin/rides`
- Purpose: List rides.
- Request body: None.
- Success: `200` with rides list.
- Fail: `400`, `401`, `403`.

### `POST /admin/rides`
- Purpose: Create ride.
- Request body: Ride creation payload.
- Success: `201` with created ride.
- Fail: `400`, `401`, `403`, `422`.

### `PUT /admin/rides`
- Purpose: Bulk update rides.
- Request body: Bulk update payload for multiple rides.
- Success: `200` with bulk update result.
- Fail: `400`, `401`, `403`.

### `DELETE /admin/rides`
- Purpose: Bulk delete rides.
- Request body: Bulk delete selection payload or ids.
- Success: `200` with bulk delete result.
- Fail: `400`, `401`, `403`.

### `GET /admin/rides/{id}`
- Purpose: Get ride details.
- Request body: None.
- Success: `200` with ride details.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/rides/{id}/refund`
- Purpose: Refund ride.
- Request body: Refund payload such as amount/reason.
- Success: `200` with refund result.
- Fail: `400`, `401`, `403`, `404`, `409`, `422`.

### `POST /admin/rides/{id}/reassign`
- Purpose: Reassign ride.
- Request body: New driver/assignment payload.
- Success: `200` with reassignment result.
- Fail: `400`, `401`, `403`, `404`, `422`.

## SOS

### `GET /admin/sos`
- Purpose: List SOS alerts.
- Request body: None.
- Success: `200` with SOS alerts list.
- Fail: `400`, `401`, `403`.

### `GET /admin/sos/{id}`
- Purpose: Get SOS alert.
- Request body: None.
- Success: `200` with SOS alert details.
- Fail: `400`, `401`, `403`, `404`.

### `POST /admin/sos/{id}/handle`
- Purpose: Handle SOS alert.
- Request body: Usually handling status/notes payload.
- Success: `200` with handled alert result.
- Fail: `400`, `401`, `403`, `404`.

## FAQs

### `GET /admin/faqs`
- Purpose: List FAQs.
- Request body: None.
- Success: `200` with FAQ list.
- Fail: `401`, `403`.

### `POST /admin/faqs`
- Purpose: Create FAQ.
- Request body: FAQ fields such as question/answer and localized content if supported.
- Success: `201` with created FAQ.
- Fail: `400`, `401`, `403`.

### `GET /admin/faqs/{id}`
- Purpose: Get FAQ details.
- Request body: None.
- Success: `200` with FAQ details.
- Fail: `400`, `401`, `403`, `404`.

### `PUT /admin/faqs/{id}`
- Purpose: Update FAQ.
- Request body: FAQ update fields.
- Success: `200` with updated FAQ.
- Fail: `400`, `401`, `403`, `404`.

### `DELETE /admin/faqs/{id}`
- Purpose: Delete FAQ.
- Request body: None.
- Success: `200` with deletion confirmation.
- Fail: `401`, `403`, `404`.

## Special Admin Endpoints

These are admin-only but do not use the `/admin/...` prefix.

### `GET /dashboard/statistics`
- Purpose: Admin dashboard summary.
- Request body: None.
- Success: `200` with platform summary metrics.
- Fail: `401`, `403`.

### `POST /notifications/send-to-user`
- Purpose: Send push notification to user.
- Request body: `user_id`, `title`, `body`, optional `data`.
- Success: `200` with send result (`sent`/`failed` counts).
- Fail: `400`, `401`, `403`, `404`, `422`.

### `POST /notifications/send-to-driver`
- Purpose: Send push notification to driver.
- Request body: `driver_id`, `title`, `body`, optional `data`.
- Success: `200` with send result (`sent`/`failed` counts).
- Fail: `400`, `401`, `403`, `404`, `422`.

## Notes

- This file is intentionally simple and high-level.
- Source of truth remains the route files under `src/modules/` and the Swagger YAML files under `swagger/`.
- Some endpoints may be documented in Swagger but not currently mounted in `src/app.js`; verify route mounting if an endpoint does not respond.
