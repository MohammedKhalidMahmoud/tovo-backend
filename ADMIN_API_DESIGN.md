# Tovo Ride-Hailing Admin Panel - RESTful API Design

## Overview
This document defines the complete RESTful API endpoints for the admin panel of the Tovo ride-hailing application. All endpoints require admin authentication via JWT token.

**Base Path:** `/api/v1/admin`

**Authentication:** All endpoints require `Authorization: Bearer <admin_token>` header

---

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Pagination & Filtering](#pagination--filtering)
3. [Users Management](#users-management)
4. [Drivers Management](#drivers-management)
5. [Rides Management](#rides-management)
6. [Pricing Management](#pricing-management)
7. [Vehicles Management](#vehicles-management)
8. [Complaints & Support](#complaints--support)
9. [Reports & Analytics](#reports--analytics)
10. [System Settings](#system-settings)

---

## Authentication & Authorization

### Admin Role Requirements
Admins will need an `admin` role in the system. This requires:
1. Adding `admin` to the Role enum in Prisma schema
2. Creating a middleware to verify admin access
3. Admin users can only be created/managed by super-admins

```javascript
// Middleware: Admin Authorization
// Usage: [authenticate, authorize('admin')]
```

### Response Format (All Endpoints)
```json
{
  "success": true/false,
  "message": "string",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2025-02-28T10:30:00Z"
}
```

---

## Pagination & Filtering

### Query Parameters (Standard across all list endpoints)
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `sortBy` (string) - Field to sort by (e.g., `createdAt`, `name`)
- `sortOrder` (string, enum: `asc`, `desc`, default: `desc`) - Sort direction
- `search` (string) - Search term (searches in multiple fields)
- `status` (string) - Filter by status
- `dateFrom` (ISO date) - Filter from date
- `dateTo` (ISO date) - Filter to date

### Response Headers
```
X-Total-Count: 150
X-Total-Pages: 8
X-Current-Page: 1
X-Per-Page: 20
```

---

# USERS MANAGEMENT

## 1. List All Users

**Endpoint:** `GET /api/v1/admin/users`

**Query Parameters:**
```
?page=1&limit=20&search=john&status=active&sortBy=createdAt&sortOrder=desc
```

**Status Filters:** `all`, `active`, `suspended`, `verified`, `unverified`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "isVerified": true,
      "isActive": true,
      "language": "en",
      "avatarUrl": "https://...",
      "notificationsEnabled": true,
      "createdAt": "2025-02-20T10:00:00Z",
      "updatedAt": "2025-02-25T15:30:00Z",
      "walletBalance": 150.50,
      "totalTrips": 42,
      "avgRating": 4.8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "pages": 13
  }
}
```

---

## 2. Get User Details

**Endpoint:** `GET /api/v1/admin/users/:userId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "isVerified": true,
    "isActive": true,
    "language": "en",
    "avatarUrl": "https://...",
    "notificationsEnabled": true,
    "createdAt": "2025-02-20T10:00:00Z",
    "updatedAt": "2025-02-25T15:30:00Z",
    "wallet": {
      "balance": 150.50,
      "currency": "EGP"
    },
    "tripsStats": {
      "totalTrips": 42,
      "completedTrips": 40,
      "cancelledTrips": 2,
      "totalSpent": 5400.00
    },
    "ratingsStats": {
      "avgRating": 4.8,
      "totalRatings": 40,
      "distribution": {
        "5: 30,
        "4": 8,
        "3": 2,
        "2": 0,
        "1": 0
      }
    },
    "savedAddresses": [
      {
        "id": "uuid",
        "label": "Home",
        "address": "123 Main St",
        "lat": 30.0444,
        "lng": 31.2357
      }
    ],
    "paymentMethods": [
      {
        "id": "uuid",
        "brand": "visa",
        "lastFour": "4242",
        "isDefault": true
      }
    ],
    "deviceTokens": [
      {
        "id": "uuid",
        "platform": "ios",
        "createdAt": "2025-02-25T10:00:00Z"
      }
    ],
    "supportTickets": {
      "total": 3,
      "open": 1,
      "resolved": 2
    }
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 3. Update User

**Endpoint:** `PUT /api/v1/admin/users/:userId`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567891",
  "language": "ar",
  "notificationsEnabled": false
}
```

**Validation Rules:**
- `name`: 2-100 characters
- `email`: Valid email format, unique
- `phone`: Valid phone format, unique
- `language`: `en` or `ar`
- `notificationsEnabled`: Boolean

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { /* updated user object */ }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - User not found
- `409 Conflict` - Email/phone already exists

---

## 4. Suspend/Unsuspend User

**Endpoint:** `POST /api/v1/admin/users/:userId/suspend`

**Request Body:**
```json
{
  "action": "suspend",  // or "unsuspend"
  "reason": "Violating terms of service",
  "durationDays": 30    // Optional, null = permanent
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "id": "uuid",
    "isActive": false,
    "suspensionReason": "Violating terms of service",
    "suspensionUntil": "2025-03-30T10:00:00Z"
  }
}
```

---

## 5. Reset User Password

**Endpoint:** `POST /api/v1/admin/users/:userId/reset-password`

**Request Body:**
```json
{
  "newPassword": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 6. Delete User Account

**Endpoint:** `DELETE /api/v1/admin/users/:userId`

**Query Parameter:**
```
?confirm=true  // Safety parameter to prevent accidental deletion
```

**Request Body (Optional):**
```json
{
  "reason": "User requested account deletion"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

---

## 7. Issue Refund to User

**Endpoint:** `POST /api/v1/admin/users/:userId/refund`

**Request Body:**
```json
{
  "amount": 100.50,
  "currency": "EGP",
  "tripId": "uuid",          // Optional, related trip
  "reason": "Service issue",
  "notes": "Driver was late"
}
```

**Validation:**
- `amount`: > 0
- `currency`: Valid currency code
- `reason`: 5-200 characters

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Refund issued successfully",
  "data": {
    "refundId": "uuid",
    "userId": "uuid",
    "amount": 100.50,
    "currency": "EGP",
    "status": "pending",  // pending, completed, failed
    "tripId": "uuid",
    "reason": "Service issue",
    "createdAt": "2025-02-28T10:30:00Z"
  }
}
```

---

# DRIVERS MANAGEMENT

## 1. List All Drivers

**Endpoint:** `GET /api/v1/admin/drivers`

**Query Parameters:**
```
?page=1&limit=20&search=ahmed&status=active&isVerified=true&onlineStatus=online
```

**Status Filters:** `all`, `active`, `suspended`, `pending`, `rejected`
**Online Status:** `all`, `online`, `offline`
**Verification Status:** `all`, `verified`, `unverified`, `pending`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "phone": "+20123456789",
      "drivingLicense": "DL123456",
      "isVerified": true,
      "isOnline": true,
      "rating": 4.9,
      "totalTrips": 250,
      "totalEarnings": 15450.00,
      "currency": "EGP",
      "language": "ar",
      "avatarUrl": "https://...",
      "vehicle": {
        "id": "uuid",
        "vin": "VIN123456",
        "type": "Economy"
      },
      "planId": "uuid",
      "planName": "pro",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2025-02-28T09:30:00Z",
      "lastActive": "2025-02-28T10:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 567,
    "pages": 29
  }
}
```

---

## 2. Get Driver Details

**Endpoint:** `GET /api/v1/admin/drivers/:driverId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ahmed Hassan",
    "email": "ahmed@example.com",
    "phone": "+20123456789",
    "drivingLicense": "DL123456",
    "licenseExpiryDate": "2026-12-31",
    "isVerified": true,
    "isOnline": true,
    "rating": 4.9,
    "totalTrips": 250,
    "totalEarnings": 15450.00,
    "language": "ar",
    "notificationsEnabled": true,
    "avatarUrl": "https://...",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2025-02-28T09:30:00Z",
    "wallet": {
      "balance": 2500.00,
      "currency": "EGP"
    },
    "vehicle": {
      "id": "uuid",
      "vin": "VIN123456",
      "typeId": "uuid",
      "typeName": "Economy",
      "registrationExpiry": "2026-06-30",
      "createdAt": "2024-06-01T10:00:00Z"
    },
    "insuranceCards": [
      {
        "id": "uuid",
        "provider": "Allied Insurance",
        "policyNumber": "POL123456",
        "expiresAt": "2026-03-30"
      }
    ],
    "plan": {
      "id": "uuid",
      "name": "pro",
      "price": 499.99,
      "credits": 150,
      "features": {}
    },
    "ratingsStats": {
      "avgRating": 4.9,
      "totalRatings": 240,
      "distribution": {
        "5": 220,
        "4": 15,
        "3": 5,
        "2": 0,
        "1": 0
      }
    },
    "tripsStats": {
      "totalTrips": 250,
      "completedTrips": 245,
      "cancelledTrips": 5,
      "avgTripDuration": 25.5,
      "totalDistance": 12450.5,
      "totalEarnings": 15450.00
    },
    "documentStatus": {
      "drivingLicenseVerified": true,
      "insuranceVerified": true,
      "vehicleDocumentsVerified": true,
      "backgroundCheckVerified": true
    },
    "supportTickets": {
      "total": 5,
      "open": 2,
      "resolved": 3
    }
  }
}
```

---

## 3. Update Driver Info

**Endpoint:** `PUT /api/v1/admin/drivers/:driverId`

**Request Body:**
```json
{
  "name": "Ahmed Hassan",
  "email": "newemail@example.com",
  "phone": "+20123456790",
  "language": "ar",
  "drivingLicense": "DL123456",
  "licenseExpiryDate": "2027-12-31",
  "notificationsEnabled": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Driver updated successfully",
  "data": { /* updated driver object */ }
}
```

---

## 4. Approve Driver Verification

**Endpoint:** `POST /api/v1/admin/drivers/:driverId/approve`

**Request Body:**
```json
{
  "reason": "All documents verified and approved"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Driver approved successfully",
  "data": {
    "id": "uuid",
    "isVerified": true,
    "approvedAt": "2025-02-28T10:30:00Z",
    "approvedBy": "admin-uuid"
  }
}
```

---

## 5. Reject Driver Application

**Endpoint:** `POST /api/v1/admin/drivers/:driverId/reject`

**Request Body:**
```json
{
  "reason": "Invalid driving license"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Driver rejected successfully",
  "data": {
    "id": "uuid",
    "isVerified": false,
    "rejectionReason": "Invalid driving license",
    "rejectedAt": "2025-02-28T10:30:00Z",
    "rejectedBy": "admin-uuid"
  }
}
```

---

## 6. Suspend/Unsuspend Driver

**Endpoint:** `POST /api/v1/admin/drivers/:driverId/suspend`

**Request Body:**
```json
{
  "action": "suspend",  // or "unsuspend"
  "reason": "Multiple complaints from users",
  "durationDays": 15    // Optional
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Driver suspended successfully",
  "data": {
    "id": "uuid",
    "isActive": false,
    "suspensionReason": "Multiple complaints from users",
    "suspensionUntil": "2025-03-15T10:00:00Z"
  }
}
```

---

## 7. Issue Refund to Driver

**Endpoint:** `POST /api/v1/admin/drivers/:driverId/refund`

**Request Body:**
```json
{
  "amount": 250.00,
  "currency": "EGP",
  "tripId": "uuid",          // Optional
  "reason": "Unfair cancellation",
  "notes": "System error caused trip cancellation"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Refund issued successfully",
  "data": {
    "refundId": "uuid",
    "driverId": "uuid",
    "amount": 250.00,
    "currency": "EGP",
    "status": "pending"
  }
}
```

---

## 8. Reset Driver Password

**Endpoint:** `POST /api/v1/admin/drivers/:driverId/reset-password`

**Request Body:**
```json
{
  "newPassword": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 9. Delete Driver Account

**Endpoint:** `DELETE /api/v1/admin/drivers/:driverId`

**Query Parameter:**
```
?confirm=true
```

**Request Body:**
```json
{
  "reason": "Account terminated"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Driver account deleted successfully"
}
```

---

# RIDES MANAGEMENT

## 1. List All Rides

**Endpoint:** `GET /api/v1/admin/rides`

**Query Parameters:**
```
?page=1&limit=20&search=ride&status=completed&userId=uuid&driverId=uuid&dateFrom=2025-01-01&dateTo=2025-02-28
```

**Status Filters:** `all`, `searching`, `matched`, `on_way`, `in_progress`, `completed`, `cancelled`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "completed",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "phone": "+1234567890",
        "rating": 4.8
      },
      "driver": {
        "id": "uuid",
        "name": "Ahmed Hassan",
        "phone": "+20123456789",
        "rating": 4.9
      },
      "pickup": {
        "address": "123 Main St",
        "lat": 30.0444,
        "lng": 31.2357,
        "timestamp": "2025-02-28T08:00:00Z"
      },
      "dropoff": {
        "address": "456 Oak Ave",
        "lat": 30.0555,
        "lng": 31.2465,
        "timestamp": "2025-02-28T08:25:00Z"
      },
      "distance": 5.2,
      "duration": 25,
      "fare": 45.50,
      "currency": "EGP",
      "paymentMethod": "visa",
      "plan": "basic",
      "rating": {
        "stars": 5,
        "comment": "Great driver and clean car"
      },
      "createdAt": "2025-02-28T08:00:00Z",
      "completedAt": "2025-02-28T08:25:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5420,
    "pages": 271
  }
}
```

---

## 2. Get Ride Details

**Endpoint:** `GET /api/v1/admin/rides/:rideId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "createdAt": "2025-02-28T08:00:00Z",
    "startedAt": "2025-02-28T08:05:00Z",
    "completedAt": "2025-02-28T08:25:00Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "rating": 4.8,
      "totalTrips": 42
    },
    "driver": {
      "id": "uuid",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "phone": "+20123456789",
      "rating": 4.9,
      "totalTrips": 250,
      "vehicle": {
        "type": "Economy",
        "licensePlate": "ABC-123"
      }
    },
    "pickup": {
      "address": "123 Main St",
      "lat": 30.0444,
      "lng": 31.2357,
      "timestamp": "2025-02-28T08:00:00Z"
    },
    "dropoff": {
      "address": "456 Oak Ave",
      "lat": 30.0555,
      "lng": 31.2465,
      "timestamp": "2025-02-28T08:25:00Z"
    },
    "route": {
      "distance": 5.2,
      "distanceKm": 5.2,
      "duration": 25,
      "durationMinutes": 25,
      "estimatedFare": 40.00,
      "actualFare": 45.50
    },
    "payment": {
      "fare": 45.50,
      "discount": 5.00,
      "finalAmount": 40.50,
      "currency": "EGP",
      "method": "visa",
      "status": "completed"
    },
    "plan": {
      "id": "uuid",
      "name": "basic",
      "price": 200.00
    },
    "rating": {
      "id": "uuid",
      "stars": 5,
      "comment": "Great driver and clean car",
      "ratedAt": "2025-02-28T08:30:00Z"
    },
    "cancellation": null  // or { cancelledAt, cancelledBy, reason }
  }
}
```

---

## 3. Cancel Ride

**Endpoint:** `POST /api/v1/admin/rides/:rideId/cancel`

**Request Body:**
```json
{
  "reason": "Driver not responding",
  "notes": "Admin cancelled due to system issue",
  "issueRefund": true,
  "refundAmount": 45.50  // Optional, defaults to full fare
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Ride cancelled successfully",
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "cancelledAt": "2025-02-28T08:30:00Z",
    "cancelledBy": "admin-uuid",
    "refundIssued": true,
    "refundAmount": 45.50
  }
}
```

---

## 4. Filter Rides by Custom Criteria

**Endpoint:** `GET /api/v1/admin/rides/search/advanced`

**Query Parameters:**
```
?status=completed&fareLow=30&fareHigh=100&durationMin=15&durationMax=60
&distanceMin=5&distanceMax=20&paymentMethod=visa&ratingMin=4&ratingMax=5
```

**Response:** `200 OK` (Same structure as list rides)

---

## 5. Export Rides Data

**Endpoint:** `GET /api/v1/admin/rides/export`

**Query Parameters:**
```
?format=csv&dateFrom=2025-01-01&dateTo=2025-02-28&status=completed
```

**Formats:** `csv`, `xlsx`, `json`

**Response:** File download (application/csv | application/xlsx)

---

# PRICING MANAGEMENT

## 1. List All Price Plans

**Endpoint:** `GET /api/v1/admin/pricing/plans`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "basic",
      "price": 200.00,
      "currency": "EGP",
      "credits": 50,
      "features": {
        "priority_matching": false,
        "24_7_support": false,
        "loyalty_points": false
      },
      "activeDrivers": 245,
      "totalRevenue": 49000.00,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2025-02-28T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "starter",
      "price": 350.00,
      "credits": 100,
      "features": {
        "priority_matching": true,
        "24_7_support": false,
        "loyalty_points": true
      },
      "activeDrivers": 150,
      "totalRevenue": 52500.00,
      "createdAt": "2024-02-01T10:00:00Z",
      "updatedAt": "2025-02-28T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "pro",
      "price": 499.99,
      "credits": 150,
      "features": {
        "priority_matching": true,
        "24_7_support": true,
        "loyalty_points": true
      },
      "activeDrivers": 172,
      "totalRevenue": 85997.28,
      "createdAt": "2024-03-01T10:00:00Z",
      "updatedAt": "2025-02-28T10:00:00Z"
    }
  ]
}
```

---

## 2. Create Price Plan

**Endpoint:** `POST /api/v1/admin/pricing/plans`

**Request Body:**
```json
{
  "name": "pro",
  "price": 499.99,
  "credits": 150,
  "features": {
    "priority_matching": true,
    "24_7_support": true,
    "loyalty_points": true,
    "discounted_airport_rides": true
  },
  "description": "Best plan for professional drivers"
}
```

**Validation:**
- `name`: Unique, 2-50 characters
- `price`: > 0
- `credits`: -1 for unlimited, or positive integer
- `features`: Valid JSON object
- `description`: Optional, max 500 characters

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Price plan created successfully",
  "data": { /* created plan object */ }
}
```

---

## 3. Update Price Plan

**Endpoint:** `PUT /api/v1/admin/pricing/plans/:planId`

**Request Body:**
```json
{
  "price": 549.99,
  "credits": 160,
  "features": {
    "priority_matching": true,
    "24_7_support": true,
    "loyalty_points": true,
    "discounted_airport_rides": true,
    "free_cancellation": true
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Price plan updated successfully",
  "data": { /* updated plan object */ }
}
```

---

## 4. Delete Price Plan

**Endpoint:** `DELETE /api/v1/admin/pricing/plans/:planId`

**Query Parameter:**
```
?confirm=true&reassignPlanId=uuid  // Reassign drivers to another plan
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Price plan deleted successfully. 50 drivers reassigned to plan: starter"
}
```

---

## 5. List Promotions/Coupons

**Endpoint:** `GET /api/v1/admin/pricing/promotions`

**Query Parameters:**
```
?page=1&limit=20&status=active&search=summer
```

**Status Filters:** `all`, `active`, `expired`, `scheduled`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Summer Special",
      "description": "50% off on all rides",
      "type": "promotion",  // or "coupon"
      "discountPct": 50,
      "code": null,  // For coupons only
      "maxUses": null,  // For coupons only
      "usedCount": 0,
      "validFrom": "2025-03-01T00:00:00Z",
      "validUntil": "2025-03-31T23:59:59Z",
      "isActive": true,
      "imageUrl": "https://...",
      "totalUsage": 245,
      "totalRevenueLoss": 12500.00,
      "createdAt": "2025-02-20T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## 6. Create Promotion

**Endpoint:** `POST /api/v1/admin/pricing/promotions`

**Request Body:**
```json
{
  "title": "Easter Special",
  "description": "40% off on Easter weekend",
  "discountPct": 40,
  "imageUrl": "https://...",
  "validFrom": "2025-04-01T00:00:00Z",
  "validUntil": "2025-04-07T23:59:59Z",
  "isActive": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Promotion created successfully",
  "data": { /* created promotion object */ }
}
```

---

## 7. Create Coupon Code

**Endpoint:** `POST /api/v1/admin/pricing/coupons`

**Request Body:**
```json
{
  "code": "SAVE20",
  "discountPct": 20,
  "maxUses": 100,
  "validFrom": "2025-03-01T00:00:00Z",
  "validUntil": "2025-03-31T23:59:59Z",
  "isActive": true
}
```

**Validation:**
- `code`: Unique, 3-20 alphanumeric characters
- `discountPct`: 1-99
- `maxUses`: Positive integer or -1 (unlimited)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "id": "uuid",
    "code": "SAVE20",
    "discountPct": 20,
    "maxUses": 100,
    "usedCount": 0,
    "validFrom": "2025-03-01T00:00:00Z",
    "validUntil": "2025-03-31T23:59:59Z",
    "isActive": true,
    "createdAt": "2025-02-28T10:30:00Z"
  }
}
```

---

## 8. Update Promotion/Coupon

**Endpoint:** `PUT /api/v1/admin/pricing/promotions/:promotionId`

**Request Body:**
```json
{
  "title": "Easter Special - Extended",
  "discountPct": 45,
  "validUntil": "2025-04-10T23:59:59Z",
  "isActive": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Promotion updated successfully",
  "data": { /* updated promotion object */ }
}
```

---

## 9. Deactivate Promotion/Coupon

**Endpoint:** `POST /api/v1/admin/pricing/promotions/:promotionId/deactivate`

**Request Body:**
```json
{
  "reason": "Expired"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Promotion deactivated successfully",
  "data": {
    "id": "uuid",
    "isActive": false,
    "deactivatedAt": "2025-02-28T10:30:00Z"
  }
}
```

---

# VEHICLES MANAGEMENT

## 1. List All Vehicle Types

**Endpoint:** `GET /api/v1/admin/vehicles/types`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Economy",
      "description": "Standard 4-seater vehicle",
      "imageUrl": "https://...",
      "totalVehicles": 245,
      "activeVehicles": 200,
      "totalTrips": 15420,
      "totalRevenue": 154200.00,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2025-02-28T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Premium",
      "description": "5-seater luxury vehicle",
      "imageUrl": "https://...",
      "totalVehicles": 89,
      "activeVehicles": 75,
      "totalTrips": 4230,
      "totalRevenue": 98700.00,
      "createdAt": "2024-02-01T10:00:00Z",
      "updatedAt": "2025-02-28T10:00:00Z"
    }
  ]
}
```

---

## 2. Create Vehicle Type

**Endpoint:** `POST /api/v1/admin/vehicles/types`

**Request Body:**
```json
{
  "name": "XL",
  "description": "7-seater vehicle for large groups",
  "imageUrl": "https://..."
}
```

**Validation:**
- `name`: Unique, 2-50 characters
- `description`: Optional, max 500 characters
- `imageUrl`: Valid URL format

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Vehicle type created successfully",
  "data": { /* created vehicle type object */ }
}
```

---

## 3. Update Vehicle Type

**Endpoint:** `PUT /api/v1/admin/vehicles/types/:typeId`

**Request Body:**
```json
{
  "name": "Economy Plus",
  "description": "Upgraded 4-seater with extra comfort",
  "imageUrl": "https://..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vehicle type updated successfully",
  "data": { /* updated vehicle type object */ }
}
```

---

## 4. Delete Vehicle Type

**Endpoint:** `DELETE /api/v1/admin/vehicles/types/:typeId`

**Query Parameter:**
```
?confirm=true&reassignTypeId=uuid
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vehicle type deleted successfully. 45 vehicles reassigned to Economy type"
}
```

---

## 5. List All Vehicles

**Endpoint:** `GET /api/v1/admin/vehicles`

**Query Parameters:**
```
?page=1&limit=20&search=ABC123&typeId=uuid&driverId=uuid&status=active
```

**Status Filters:** `all`, `active`, `inactive`, `pending_verification`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vin": "VIN123456789",
      "licensePlate": "ABC-123",
      "type": {
        "id": "uuid",
        "name": "Economy"
      },
      "driver": {
        "id": "uuid",
        "name": "Ahmed Hassan",
        "email": "ahmed@example.com",
        "phone": "+20123456789"
      },
      "status": "active",
      "registrationExpiry": "2026-06-30",
      "insuranceExpiry": "2026-03-30",
      "lastInspectionDate": "2025-02-01",
      "nextInspectionDue": "2025-08-01",
      "totalTrips": 250,
      "totalDistance": 12450.5,
      "createdAt": "2024-06-01T10:00:00Z",
      "updatedAt": "2025-02-28T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## 6. Get Vehicle Details

**Endpoint:** `GET /api/v1/admin/vehicles/:vehicleId`

**Response:** `200 OK` (Detailed vehicle object with all related info)

---

## 7. Update Vehicle

**Endpoint:** `PUT /api/v1/admin/vehicles/:vehicleId`

**Request Body:**
```json
{
  "vin": "VIN987654321",
  "licensePlate": "XYZ-999",
  "typeId": "uuid",
  "registrationExpiry": "2027-06-30",
  "insuranceExpiry": "2027-03-30"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vehicle updated successfully",
  "data": { /* updated vehicle object */ }
}
```

---

## 8. Verify Vehicle Documents

**Endpoint:** `POST /api/v1/admin/vehicles/:vehicleId/verify`

**Request Body:**
```json
{
  "action": "approve",  // or "reject"
  "reason": "All documents verified"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vehicle verified successfully",
  "data": {
    "id": "uuid",
    "status": "active",
    "verifiedAt": "2025-02-28T10:30:00Z",
    "verifiedBy": "admin-uuid"
  }
}
```

---

## 9. Deactivate Vehicle

**Endpoint:** `POST /api/v1/admin/vehicles/:vehicleId/deactivate`

**Request Body:**
```json
{
  "reason": "Insurance expired",
  "durationDays": 30  // Optional
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vehicle deactivated successfully"
}
```

---

## 10. Schedule Vehicle Inspection

**Endpoint:** `POST /api/v1/admin/vehicles/:vehicleId/schedule-inspection`

**Request Body:**
```json
{
  "scheduledDate": "2025-03-15T10:00:00Z",
  "location": "Main Service Center",
  "notes": "Routine maintenance check"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Inspection scheduled successfully",
  "data": {
    "inspectionId": "uuid",
    "vehicleId": "uuid",
    "scheduledDate": "2025-03-15T10:00:00Z",
    "status": "scheduled"
  }
}
```

---

# COMPLAINTS & SUPPORT

## 1. List All Support Tickets

**Endpoint:** `GET /api/v1/admin/support/tickets`

**Query Parameters:**
```
?page=1&limit=20&status=open&search=complaint&type=user_complaint&priority=high
&dateFrom=2025-01-01&dateTo=2025-02-28
```

**Status Filters:** `all`, `open`, `in_progress`, `resolved`, `closed`
**Type Filters:** `all`, `complaint`, `issue`, `suggestion`, `general_support`
**Priority:** `all`, `low`, `medium`, `high`, `critical`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticketNumber": "TK-2025-001234",
      "subject": "Driver was rude",
      "status": "open",
      "priority": "high",
      "type": "complaint",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "driver": null,
      "relatedRide": {
        "id": "uuid",
        "fare": 45.50
      },
      "messagesCount": 3,
      "lastUpdated": "2025-02-28T09:15:00Z",
      "createdAt": "2025-02-27T14:30:00Z",
      "createdBy": "user"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## 2. Get Support Ticket Details

**Endpoint:** `GET /api/v1/admin/support/tickets/:ticketId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketNumber": "TK-2025-001234",
    "subject": "Driver was rude",
    "description": "The driver was very rude throughout the trip and made me feel unsafe",
    "status": "open",
    "priority": "high",
    "type": "complaint",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "driver": null,
    "relatedRide": {
      "id": "uuid",
      "fare": 45.50,
      "date": "2025-02-25T14:00:00Z"
    },
    "messages": [
      {
        "id": "uuid",
        "senderId": "user-uuid",
        "senderName": "John Doe",
        "senderType": "user",  // or "admin", "driver"
        "body": "The driver was very rude throughout the trip",
        "attachments": [],
        "createdAt": "2025-02-27T14:30:00Z"
      },
      {
        "id": "uuid",
        "senderId": "admin-uuid",
        "senderName": "Admin Support",
        "senderType": "admin",
        "body": "We sincerely apologize for the experience. We will investigate this matter.",
        "attachments": [],
        "createdAt": "2025-02-27T15:00:00Z"
      }
    ],
    "resolution": {
      "action": "refund_issued",
      "amount": 45.50,
      "currency": "EGP"
    },
    "createdAt": "2025-02-27T14:30:00Z",
    "updatedAt": "2025-02-28T09:15:00Z",
    "closedAt": null
  }
}
```

---

## 3. Update Ticket Status

**Endpoint:** `PUT /api/v1/admin/support/tickets/:ticketId`

**Request Body:**
```json
{
  "status": "in_progress",  // open, in_progress, resolved, closed
  "priority": "high",
  "assignedTo": "admin-uuid"  // Optional
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Ticket updated successfully",
  "data": { /* updated ticket object */ }
}
```

---

## 4. Add Message to Ticket

**Endpoint:** `POST /api/v1/admin/support/tickets/:ticketId/messages`

**Request Body:**
```json
{
  "body": "We have issued a refund of 45.50 EGP to your account.",
  "attachments": [
    {
      "type": "image",
      "url": "https://...",
      "fileName": "proof.jpg"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Message added successfully",
  "data": {
    "id": "uuid",
    "ticketId": "uuid",
    "senderId": "admin-uuid",
    "senderName": "Admin Support",
    "senderType": "admin",
    "body": "We have issued a refund of 45.50 EGP to your account.",
    "createdAt": "2025-02-28T10:30:00Z"
  }
}
```

---

## 5. Resolve Ticket

**Endpoint:** `POST /api/v1/admin/support/tickets/:ticketId/resolve`

**Request Body:**
```json
{
  "action": "refund_issued",  // refund_issued, driver_warned, driver_suspended, no_action
  "amount": 45.50,  // Required if action is refund_issued
  "notes": "Refund processed and customer notified",
  "sendNotification": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Ticket resolved successfully",
  "data": {
    "id": "uuid",
    "status": "resolved",
    "resolution": {
      "action": "refund_issued",
      "amount": 45.50,
      "processedAt": "2025-02-28T10:30:00Z"
    },
    "resolvedAt": "2025-02-28T10:30:00Z"
  }
}
```

---

## 6. Close Ticket

**Endpoint:** `POST /api/v1/admin/support/tickets/:ticketId/close`

**Request Body:**
```json
{
  "reason": "Customer satisfied with resolution"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Ticket closed successfully",
  "data": {
    "id": "uuid",
    "status": "closed",
    "closedAt": "2025-02-28T10:30:00Z"
  }
}
```

---

## 7. Export Support Tickets

**Endpoint:** `GET /api/v1/admin/support/tickets/export`

**Query Parameters:**
```
?format=csv&status=resolved&dateFrom=2025-01-01&dateTo=2025-02-28
```

**Response:** File download

---

# REPORTS & ANALYTICS

## 1. Dashboard Summary

**Endpoint:** `GET /api/v1/admin/analytics/dashboard`

**Query Parameters:**
```
?dateFrom=2025-02-01&dateTo=2025-02-28
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": {
      "dateFrom": "2025-02-01",
      "dateTo": "2025-02-28",
      "days": 28
    },
    "summary": {
      "totalUsers": 5420,
      "newUsers": 245,
      "totalDrivers": 567,
      "newDrivers": 42,
      "totalRides": 18540,
      "completedRides": 17850,
      "cancelledRides": 690,
      "totalRevenue": 475200.00,
      "totalRefunds": 25400.00,
      "netRevenue": 449800.00
    },
    "userMetrics": {
      "avgRating": 4.7,
      "activeUsers": 3200,
      "suspendedUsers": 15,
      "verifiedUsers": 5000
    },
    "driverMetrics": {
      "avgRating": 4.8,
      "onlineDrivers": 245,
      "activeDrivers": 450,
      "inactiveDrivers": 117,
      "verifiedDrivers": 550,
      "suspendedDrivers": 8
    },
    "rideMetrics": {
      "avgFare": 25.60,
      "avgDuration": 22.5,
      "avgDistance": 8.3,
      "completionRate": 96.3,
      "cancellationRate": 3.7
    },
    "topRoutes": [
      {
        "from": "Downtown",
        "to": "Airport",
        "trips": 2450,
        "avgFare": 85.50
      }
    ],
    "topVehicleTypes": [
      {
        "type": "Economy",
        "trips": 15420,
        "percentage": 83.0
      }
    ]
  }
}
```

---

## 2. User Analytics

**Endpoint:** `GET /api/v1/admin/analytics/users`

**Query Parameters:**
```
?dateFrom=2025-02-01&dateTo=2025-02-28&groupBy=daily
```

**GroupBy Options:** `daily`, `weekly`, `monthly`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "date": "2025-02-01",
        "newUsers": 8,
        "activeUsers": 150,
        "suspendedUsers": 2,
        "totalTrips": 485,
        "totalSpent": 12340.50
      }
    ],
    "demographics": {
      "byLanguage": {
        "en": 3200,
        "ar": 2220
      },
      "avgRating": 4.7,
      "totalVerified": 5000,
      "totalUnverified": 420
    },
    "paymentMethods": [
      {
        "type": "visa",
        "count": 2800,
        "percentage": 51.6
      },
      {
        "type": "mastercard",
        "count": 1950,
        "percentage": 35.9
      }
    ]
  }
}
```

---

## 3. Driver Analytics

**Endpoint:** `GET /api/v1/admin/analytics/drivers`

**Query Parameters:**
```
?dateFrom=2025-02-01&dateTo=2025-02-28&groupBy=daily
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "date": "2025-02-01",
        "newDrivers": 3,
        "activeDrivers": 430,
        "onlineDrivers": 200,
        "totalTrips": 2150,
        "totalEarnings": 54200.00,
        "avgRating": 4.8
      }
    ],
    "topEarners": [
      {
        "driverId": "uuid",
        "name": "Ahmed Hassan",
        "totalEarnings": 85400.00,
        "totalTrips": 450,
        "avgRating": 4.9
      }
    ],
    "topRated": [
      {
        "driverId": "uuid",
        "name": "Fatima Ali",
        "avgRating": 4.95,
        "ratingCount": 320,
        "totalTrips": 350
      }
    ],
    "vehicleTypeDistribution": [
      {
        "type": "Economy",
        "drivers": 420,
        "percentage": 74.1
      }
    ],
    "planDistribution": [
      {
        "planName": "pro",
        "drivers": 172,
        "percentage": 30.3,
        "totalRevenue": 85997.28
      }
    ]
  }
}
```

---

## 4. Ride Analytics

**Endpoint:** `GET /api/v1/admin/analytics/rides`

**Query Parameters:**
```
?dateFrom=2025-02-01&dateTo=2025-02-28&groupBy=daily
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "date": "2025-02-01",
        "totalRides": 662,
        "completedRides": 637,
        "cancelledRides": 25,
        "totalRevenue": 16975.20,
        "avgFare": 25.60,
        "avgDuration": 22.5,
        "avgDistance": 8.3,
        "avgRating": 4.7
      }
    ],
    "byStatus": {
      "completed": 17850,
      "cancelled": 690,
      "total": 18540
    },
    "byCancelledBy": {
      "user": 400,
      "driver": 250,
      "system": 40
    },
    "byTimeOfDay": [
      {
        "hour": "08:00-09:00",
        "rides": 450,
        "avgFare": 28.50
      }
    ],
    "byVehicleType": [
      {
        "type": "Economy",
        "rides": 15420,
        "percentage": 83.0,
        "totalRevenue": 394620.00
      }
    ],
    "topRoutes": [
      {
        "from": "Downtown",
        "to": "Airport",
        "trips": 2450,
        "avgFare": 85.50,
        "totalRevenue": 209425.00
      }
    ]
  }
}
```

---

## 5. Financial Reports

**Endpoint:** `GET /api/v1/admin/analytics/financial`

**Query Parameters:**
```
?dateFrom=2025-02-01&dateTo=2025-02-28&groupBy=daily
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "date": "2025-02-01",
        "totalRevenue": 16975.20,
        "userPayments": 12340.50,
        "driverEarnings": 14230.00,
        "platformFee": 2745.20,
        "refunds": 1150.00,
        "netRevenue": 15825.20
      }
    ],
    "summary": {
      "totalRevenue": 475200.00,
      "totalRefunds": 25400.00,
      "netRevenue": 449800.00,
      "platformFeeCollected": 76320.00,
      "driverPayouts": 397480.00
    },
    "paymentMethods": [
      {
        "method": "visa",
        "amount": 245700.30,
        "percentage": 51.65,
        "transactionCount": 8950
      }
    ],
    "refundBreakdown": [
      {
        "reason": "Driver issue",
        "amount": 12500.00,
        "count": 125
      },
      {
        "reason": "System error",
        "amount": 8200.00,
        "count": 82
      },
      {
        "reason": "User request",
        "amount": 4700.00,
        "count": 47
      }
    ],
    "promotionImpact": {
      "totalDiscountGiven": 18500.00,
      "totalRidesWithPromotion": 1850,
      "avgDiscount": 10.00
    }
  }
}
```

---

## 6. Complaint Analytics

**Endpoint:** `GET /api/v1/admin/analytics/complaints`

**Query Parameters:**
```
?dateFrom=2025-02-01&dateTo=2025-02-28
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalComplaints": 450,
      "openComplaints": 25,
      "resolvedComplaints": 400,
      "avgResolutionTime": 2.5,
      "resolutionRate": 88.9
    },
    "byType": [
      {
        "type": "driver_behavior",
        "count": 180,
        "percentage": 40.0
      },
      {
        "type": "vehicle_issue",
        "count": 120,
        "percentage": 26.7
      },
      {
        "type": "fare_dispute",
        "count": 100,
        "percentage": 22.2
      },
      {
        "type": "safety_issue",
        "count": 50,
        "percentage": 11.1
      }
    ],
    "byPriority": [
      {
        "priority": "critical",
        "count": 30,
        "avgResolutionTime": 4.2
      }
    ],
    "resolutionMethods": [
      {
        "method": "refund_issued",
        "count": 200,
        "avgAmount": 45.50
      },
      {
        "method": "driver_warned",
        "count": 150
      },
      {
        "method": "driver_suspended",
        "count": 50
      }
    ],
    "topComplainingUsers": [
      {
        "userId": "uuid",
        "name": "John Doe",
        "complaintCount": 5,
        "status": "flagged"
      }
    ],
    "mostReportedDrivers": [
      {
        "driverId": "uuid",
        "name": "Ahmed Hassan",
        "complaintCount": 12,
        "status": "under_review"
      }
    ]
  }
}
```

---

## 7. Export Report

**Endpoint:** `GET /api/v1/admin/analytics/export`

**Query Parameters:**
```
?reportType=financial&dateFrom=2025-01-01&dateTo=2025-02-28&format=pdf
```

**Report Types:** `dashboard`, `users`, `drivers`, `rides`, `financial`, `complaints`, `comprehensive`
**Formats:** `pdf`, `csv`, `xlsx`, `json`

**Response:** File download

---

# SYSTEM SETTINGS

## 1. Get System Settings

**Endpoint:** `GET /api/v1/admin/settings`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "general": {
      "appName": "Tovo",
      "supportEmail": "support@tovo.com",
      "supportPhone": "+20123456789",
      "maintenanceMode": false,
      "maintenanceMessage": "System under maintenance"
    },
    "pricing": {
      "currency": "EGP",
      "platformFeePercentage": 16.0,
      "minFare": 15.00,
      "baseFare": 5.00,
      "perKmRate": 2.50,
      "perMinuteRate": 0.50,
      "surgePricingEnabled": true,
      "surgePricingMultiplier": 1.5
    },
    "features": {
      "scheduledRidesEnabled": true,
      "promoCodesEnabled": true,
      "referralProgramEnabled": true,
      "loyaltyPointsEnabled": true,
      "ridePoolingEnabled": false,
      "insuranceEnabled": true,
      "emergencyContactEnabled": true
    },
    "limits": {
      "maxRideWaitTime": 300,  // seconds
      "maxCancellationTime": 60,  // seconds
      "maxRiderRating": 5,
      "minDriverRating": 4.0,
      "maxConcurrentRides": 1,
      "rateLimitPerMinute": 100
    },
    "notifications": {
      "emailNotificationsEnabled": true,
      "smsNotificationsEnabled": true,
      "pushNotificationsEnabled": true,
      "emailVerificationRequired": true,
      "phoneVerificationRequired": true
    },
    "security": {
      "jwtExpiryMinutes": 1440,
      "refreshTokenExpiryDays": 30,
      "otpExpiryMinutes": 5,
      "maxLoginAttempts": 5,
      "accountLockDurationMinutes": 15,
      "passwordMinLength": 8
    },
    "geoLocation": {
      "centerLat": 30.0444,
      "centerLng": 31.2357,
      "servicingRadius": 50,  // km
      "updateIntervalSeconds": 5
    },
    "thirdParty": {
      "googleMapsEnabled": true,
      "firebaseEnabled": true,
      "twilioEnabled": true,
      "stripeEnabled": true
    }
  }
}
```

---

## 2. Update System Settings

**Endpoint:** `PUT /api/v1/admin/settings`

**Request Body:**
```json
{
  "general": {
    "maintenanceMode": false,
    "supportEmail": "newemail@tovo.com"
  },
  "pricing": {
    "platformFeePercentage": 17.0,
    "baseFare": 5.50,
    "surgePricingMultiplier": 1.8
  },
  "features": {
    "scheduledRidesEnabled": true,
    "ridePoolingEnabled": true
  },
  "limits": {
    "maxRideWaitTime": 360,
    "minDriverRating": 4.2
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": { /* updated settings object */ }
}
```

---

## 3. Get Feature Flags

**Endpoint:** `GET /api/v1/admin/settings/features`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "scheduledRides": {
      "enabled": true,
      "rolloutPercentage": 100,
      "lastUpdated": "2025-02-20T10:00:00Z"
    },
    "ridePooling": {
      "enabled": false,
      "rolloutPercentage": 0,
      "lastUpdated": "2025-02-15T10:00:00Z",
      "reason": "Under testing"
    }
  }
}
```

---

## 4. Update Feature Flags

**Endpoint:** `PUT /api/v1/admin/settings/features/:featureName`

**Request Body:**
```json
{
  "enabled": true,
  "rolloutPercentage": 50,
  "reason": "Beta testing with 50% of users"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Feature flag updated successfully",
  "data": {
    "name": "ridePooling",
    "enabled": true,
    "rolloutPercentage": 50
  }
}
```

---

## 5. Manage Banned Words/Content

**Endpoint:** `GET /api/v1/admin/settings/content-moderation`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "bannedWords": ["word1", "word2"],
    "bannedPhones": ["+1234567890"],
    "bannedEmails": ["spam@example.com"]
  }
}
```

---

## 6. Add Banned Content

**Endpoint:** `POST /api/v1/admin/settings/content-moderation/banned-words`

**Request Body:**
```json
{
  "words": ["newbadword1", "newbadword2"],
  "reason": "Offensive content"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Banned words added successfully"
}
```

---

## 7. Get Audit Logs

**Endpoint:** `GET /api/v1/admin/settings/audit-logs`

**Query Parameters:**
```
?page=1&limit=20&action=user_suspended&adminId=uuid&dateFrom=2025-02-01
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "adminId": "uuid",
      "adminName": "Admin User",
      "action": "user_suspended",
      "entityId": "user-uuid",
      "entityType": "user",
      "changes": {
        "isActive": [true, false],
        "suspensionReason": [null, "Violating terms"]
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-02-28T10:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## 8. System Health Check

**Endpoint:** `GET /api/v1/admin/health`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "connected",
      "latency": 5,  // ms
      "connections": 12
    },
    "cache": {
      "status": "connected",
      "latency": 2
    },
    "messageQueue": {
      "status": "connected",
      "pendingMessages": 145
    },
    "fileStorage": {
      "status": "connected",
      "usedStorage": 52.4  // GB
    },
    "emailService": {
      "status": "connected",
      "failedEmails": 3
    },
    "smsService": {
      "status": "connected",
      "failedSms": 1
    },
    "apiStatus": {
      "responseTime": 45,  // ms
      "requestsPerSecond": 125,
      "errorRate": 0.2  // %
    }
  }
}
```

---

## 9. Get Backup Status

**Endpoint:** `GET /api/v1/admin/settings/backups`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "lastBackup": {
      "timestamp": "2025-02-28T02:00:00Z",
      "size": 2.5,  // GB
      "status": "success",
      "type": "automatic"
    },
    "backups": [
      {
        "id": "uuid",
        "timestamp": "2025-02-28T02:00:00Z",
        "size": 2.5,
        "status": "success",
        "type": "automatic"
      }
    ],
    "backupSchedule": "daily at 02:00 UTC"
  }
}
```

---

## 10. Trigger Manual Backup

**Endpoint:** `POST /api/v1/admin/settings/backups/trigger`

**Request Body:**
```json
{
  "type": "full"  // full, incremental
}
```

**Response:** `202 Accepted`
```json
{
  "success": true,
  "message": "Backup initiated successfully",
  "data": {
    "backupId": "uuid",
    "status": "in_progress"
  }
}
```

---

# Error Handling

## Standard Error Response Format

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": {
    "code": "ERROR_CODE",
    "status": 400,
    "details": "Additional error details"
  }
}
```

## Common HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful resource creation
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (duplicate)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service under maintenance

---

# Authentication & Authorization

## Admin Role Requirements

Add to Prisma schema `Role` enum:
```prisma
enum Role {
  user
  captain
  admin        // NEW
}
```

## Admin Middleware

```javascript
const adminOnly = [authenticate, authorize('admin')];
```

## Admin User Creation (Super-Admin Only)

Access: Only existing admins can create new admins

**Endpoint:** `POST /api/v1/admin/users`

**Request Body:**
```json
{
  "name": "New Admin",
  "email": "admin@tovo.com",
  "phone": "+20123456789",
  "password": "SecurePassword123!",
  "role": "admin",
  "permissions": [
    "manage_users",
    "manage_drivers",
    "manage_rides",
    "manage_support",
    "view_analytics",
    "manage_settings"
  ]
}
```

---

# Implementation Checklist

## Phase 1: Core Admin Module Setup
- [ ] Add `admin` role to Prisma schema
- [ ] Create admin middleware for authentication
- [ ] Create admin routes file structure
- [ ] Create admin controllers with business logic
- [ ] Create admin validators
- [ ] Implement admin repositories

## Phase 2: Users Management
- [ ] List/Get/Update user endpoints
- [ ] Suspend/Unsuspend user
- [ ] Reset password endpoint
- [ ] Refund endpoint
- [ ] Delete user endpoint

## Phase 3: Drivers Management
- [ ] List/Get/Update driver endpoints
- [ ] Approve/Reject verification
- [ ] Suspend/Unsuspend driver
- [ ] Refund endpoint
- [ ] Reset password

## Phase 4: Rides Management
- [ ] List/Get ride endpoints
- [ ] Cancel ride with refund option
- [ ] Advanced search filtering
- [ ] Export rides data

## Phase 5: Pricing Management
- [ ] CRUD operations for price plans
- [ ] Create/Update/Deactivate promotions
- [ ] Manage coupon codes
- [ ] Track promotion usage

## Phase 6: Vehicles Management
- [ ] Vehicle type CRUD
- [ ] Vehicle management
- [ ] Document verification
- [ ] Inspection scheduling

## Phase 7: Support & Complaints
- [ ] Support ticket management
- [ ] Message management
- [ ] Resolution tracking
- [ ] Ticket export

## Phase 8: Analytics & Reports
- [ ] Dashboard summary
- [ ] User/Driver/Ride analytics
- [ ] Financial reports
- [ ] Complaint analytics
- [ ] Report export

## Phase 9: System Settings
- [ ] General settings management
- [ ] Feature flags
- [ ] Content moderation
- [ ] Audit logging
- [ ] Health checks
- [ ] Backup management

## Phase 10: Testing & Documentation
- [ ] Unit tests for admin endpoints
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Admin panel frontend implementation

---

# Security Considerations

1. **Authentication:** All endpoints require valid admin JWT token
2. **Authorization:** Role-based access with specific permissions
3. **Validation:** Strict input validation on all endpoints
4. **Audit Logging:** Log all admin actions for compliance
5. **Rate Limiting:** Implement rate limiting on sensitive endpoints
6. **Data Encryption:** Encrypt sensitive data (PII, payment info)
7. **HTTPS Only:** All requests must use HTTPS in production
8. **CORS:** Configure CORS properly for admin panel origin only
9. **SQL Injection Prevention:** Use parameterized queries (Prisma handles this)
10. **XSS Prevention:** Sanitize all user inputs and outputs

---

# Pagination Best Practices

- Default page size: 20, max: 100
- Include total count in response headers
- Always validate page and limit parameters
- Support offset-based and cursor-based pagination
- Return metadata about current page, total pages, and items

---

# Notes for Implementation

1. **Database Performance:** Create indexes on frequently searched/filtered fields
2. **Caching:** Implement Redis caching for dashboard and analytics
3. **Background Jobs:** Use job queues for long-running tasks (exports, backups)
4. **Webhooks:** Consider webhook support for real-time event notifications
5. **API Versioning:** Already using `/api/v1/admin` pattern - maintain for future versions
6. **Monitoring:** Set up alerting for critical operations
7. **Documentation:** Keep Swagger/OpenAPI specs up to date
8. **Rate Limiting:** Apply stricter limits for sensitive operations
9. **Testing:** Comprehensive test coverage for admin operations
10. **User Feedback:** Log admin actions for future audit and compliance

---

**Document Version:** 1.0
**Last Updated:** 2025-02-28
**Status:** Ready for Implementation
