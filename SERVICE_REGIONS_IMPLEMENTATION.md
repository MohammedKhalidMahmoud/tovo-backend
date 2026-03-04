# Service Regions Feature Implementation Guide

## Overview
This implementation adds support for service regions that allow admins to define circular service areas where customers can place orders. Orders are only accepted if their pickup location falls within one of the defined regions.

---

## What Was Changed

### 1. **Database Schema Updates** (`prisma/schema.prisma`)
Added `radius` field to the Region model:
```prisma
model Region {
  id        String   @id @default(uuid())
  name      String
  country   String
  city      String?
  lat       Float?
  lng       Float?
  radius    Float?   // NEW: Radius in kilometers for circular service area
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("regions")
}
```

**Migration**: Automatically created via `npx prisma migrate dev --name add_radius_to_regions`

### 2. **Location Utilities** (`src/utils/location.js`) - **NEW FILE**
Created location validation utilities using the Haversine formula:
- `haversineKm(lat1, lng1, lat2, lng2)` - Calculate distance between two points
- `isPointInCircle(pointLat, pointLng, centerLat, centerLng, radiusKm)` - Check if a point is within a circular region
- `findPointInRegions(pointLat, pointLng, regions)` - Find which region contains a point

### 3. **Region Admin Service** (`src/modules/admin/regions/regions.service.js`)
Updated to support radius field:
- `listRegions()` - List all regions with pagination
- `getRegion(id)` - Get a specific region
- `listActiveRegions()` - **NEW**: Get only active regions (used by trip validation)
- `createRegion()` - Create region with radius support
- `updateRegion()` - Update region including radius
- `deleteRegion()` - Delete a region

### 4. **Region Admin Routes** (`src/modules/admin/regions/regions.routes.js`)
Added validation for radius field:
```javascript
body('radius').optional().isFloat({ min: 0.1 }).withMessage('radius must be a positive number (in km)')
```

### 5. **Trips Service** (`src/modules/trips/trips.service.js`)
- **NEW**: `validatePickupInRegion(pickupLat, pickupLng)` - Validates pickup location is within an active region
- Updated `createTrip()` to call region validation before creating a trip
- If no regions exist, the trip is allowed (backward compatibility)
- If regions exist and pickup is outside all of them, the trip is rejected with a 422 status code

### 6. **Trips Controller & Routes** (`src/modules/trips/trips.controller.js` & `trips.routes.js`)
- **NEW**: `getActiveRegions()` endpoint - Public endpoint to fetch active service regions
- Added import for regions service

---

## API Endpoints

### Admin Endpoints

#### Create Region
```http
POST /api/v1/admin/regions
Content-Type: application/json

{
  "name": "Downtown Cairo",
  "country": "Egypt",
  "city": "Cairo",
  "lat": 30.0444,
  "lng": 31.2357,
  "radius": 25.5,
  "isActive": true
}
```

**Response**: 201 Created
```json
{
  "id": "uuid",
  "name": "Downtown Cairo",
  "country": "Egypt",
  "city": "Cairo",
  "lat": 30.0444,
  "lng": 31.2357,
  "radius": 25.5,
  "isActive": true,
  "createdAt": "2026-03-04T12:00:00Z",
  "updatedAt": "2026-03-04T12:00:00Z"
}
```

#### Update Region
```http
PUT /api/v1/admin/regions/{regionId}
Content-Type: application/json

{
  "radius": 30.0,
  "isActive": true
}
```

#### List Regions
```http
GET /api/v1/admin/regions?page=1&limit=20&isActive=true&search=Cairo
```

#### Get Region
```http
GET /api/v1/admin/regions/{regionId}
```

#### Delete Region
```http
DELETE /api/v1/admin/regions/{regionId}
```

### Public Endpoints

#### Get Active Service Regions
```http
GET /api/v1/trips/regions/active
```

**Response**: 200 OK
```json
[
  {
    "id": "uuid",
    "name": "Downtown Cairo",
    "lat": 30.0444,
    "lng": 31.2357,
    "radius": 25.5
  },
  {
    "id": "uuid",
    "name": "Giza",
    "lat": 30.0131,
    "lng": 31.2089,
    "radius": 20.0
  }
]
```

---

## How Region Validation Works

### Flow
1. **User initiates a trip** with pickup coordinates
2. **validatePickupInRegion()** is called in `createTrip()`
3. **Admin-defined regions are fetched** from the database
4. **Point-in-circle check** is performed using Haversine formula
5. **Result**:
   - ✅ If pickup is within ANY active region → Trip is created
   - ❌ If pickup is OUTSIDE all regions → 422 error is returned
   - ✅ If NO regions defined → Trip is created (backward compatibility)

### Distance Calculation
The Haversine formula calculates the great-circle distance between two points on Earth:

```
distance = 2R * arctan2(√a, √(1-a))

where:
- R = Earth's radius (6371 km)
- a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
```

---

## Implementation Details

### Region Validation Function
Location: `src/utils/location.js`

```javascript
const findPointInRegions = (pointLat, pointLng, regions) => {
  for (const region of regions) {
    if (isPointInCircle(pointLat, pointLng, region.lat, region.lng, region.radius)) {
      return region;
    }
  }
  return null;
};
```

### Trip Creation Logic
Location: `src/modules/trips/trips.service.js`

```javascript
const createTrip = async (userId, body) => {
  // ... service validation ...
  
  // NEW: Validate pickup location is within a service region
  await validatePickupInRegion(pickup_lat, pickup_lng);
  
  // ... fare calculation and trip creation ...
};
```

---

## Configuration

### Radius Units
- All radius values are in **kilometers (km)**
- Example: `radius: 25.5` means 25.5 km radius

### Active Regions Caching
- Active regions are fetched from the database on each trip creation
- For high-traffic scenarios, consider implementing caching (Redis)
- To add caching:
  ```javascript
  // In listActiveRegions service:
  const cached = await redis.get('active_regions');
  if (cached) return JSON.parse(cached);
  // ... fetch from DB ...
  await redis.setex('active_regions', 3600, JSON.stringify(regions));
  ```

---

## Error Handling

### When Pickup is Outside Service Area
**Status Code**: 422 Unprocessable Entity
```json
{
  "error": "Pickup location is outside all service regions. Please select a location within the service area.",
  "statusCode": 422
}
```

### Invalid Region Data
- Missing required `lat`, `lng`, or `radius` → Region check is skipped
- Invalid coordinates → Haversine calculation may be inaccurate

---

## Testing Guide

### Setup Test Regions
```bash
curl -X POST http://localhost:3000/api/v1/admin/regions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "name": "Test Region",
    "country": "Egypt",
    "city": "Cairo",
    "lat": 30.0444,
    "lng": 31.2357,
    "radius": 10.0
  }'
```

### Test Valid Pickup (Within Region)
```bash
curl -X POST http://localhost:3000/api/v1/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {USER_TOKEN}" \
  -d '{
    "pickup_lat": 30.0444,
    "pickup_lng": 31.2357,
    "pickup_address": "Tahrir Square, Cairo",
    "dropoff_lat": 30.1050,
    "dropoff_lng": 31.3100,
    "dropoff_address": "Zamalek, Cairo",
    "service_id": "uuid",
    "payment_method_id": "uuid"
  }'
```

### Test Invalid Pickup (Outside Region)
```bash
curl -X POST http://localhost:3000/api/v1/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {USER_TOKEN}" \
  -d '{
    "pickup_lat": 35.0000,
    "pickup_lng": 35.0000,
    "pickup_address": "Outside Region",
    "dropoff_lat": 30.1050,
    "dropoff_lng": 31.3100,
    "dropoff_address": "Zamalek, Cairo",
    "service_id": "uuid",
    "payment_method_id": "uuid"
  }'
# Expected: 422 error
```

### Get Active Regions
```bash
curl -X GET http://localhost:3000/api/v1/trips/regions/active \
  -H "Content-Type: application/json"
# No authentication required
```

---

## File Structure

```
tovo-backend/
├── prisma/
│   └── schema.prisma                (Updated: Region model with radius)
│
├── src/
│   ├── utils/
│   │   └── location.js              (NEW: Location utilities)
│   │
│   ├── modules/
│   │   ├── admin/
│   │   │   └── regions/
│   │   │       ├── regions.controller.js  (Updated: Error handling)
│   │   │       ├── regions.service.js     (Updated: radius support + listActiveRegions)
│   │   │       └── regions.routes.js      (Updated: radius validation)
│   │   │
│   │   └── trips/
│   │       ├── trips.controller.js        (Updated: getActiveRegions method)
│   │       ├── trips.service.js           (Updated: validatePickupInRegion + createTrip validation)
│   │       └── trips.routes.js            (Updated: public regions endpoint)
```

---

## Migration Checklist

- [x] Update Prisma schema with radius field
- [x] Create and run database migration
- [x] Create location utilities with Haversine formula
- [x] Update region service to support radius
- [x] Update region routes with radius validation
- [x] Implement region validation in trips service
- [x] Create public endpoint for active regions
- [x] Add error handling for region validation failures
- [x] Test region creation with various radii
- [x] Test trip creation with valid/invalid pickup locations
- [x] Test backward compatibility (no regions defined)

---

## Performance Considerations

### Database Queries
- `listActiveRegions()` fetches all active regions on each trip creation
- Consider adding an index on `isActive` field:
  ```sql
  CREATE INDEX idx_regions_is_active ON regions(isActive);
  ```

### Distance Calculations
- Haversine formula is computationally cheap (~5 floating-point operations per region)
- With 100+ regions, calculations should still complete in < 5ms

### Recommended Optimizations
1. **Cache active regions** in memory or Redis
2. **Use spatial indexing** (PostGIS) for very large numbers of regions
3. **Batch region checks** if checking multiple points

---

## Future Enhancements

1. **Polygon Regions**: Support complex shapes (GeoJSON polygons)
2. **Price Tiers**: Different pricing for different regions
3. **Regional Surge Pricing**: Adjust fares based on demand in specific regions
4. **Region-specific Services**: Define which services operate in which regions
5. **Real-time Fencing**: Notify users when they enter/exit service areas
6. **Heat Maps**: Admin dashboard showing trip density in regions

---

## Troubleshooting

### Issue: Trip creation fails with "Pickup location is outside all service regions"
**Solution**: 
1. Verify regions are created and active: `GET /api/v1/admin/regions?isActive=true`
2. Check region coordinates and radius are correct
3. Use `GET /api/v1/trips/regions/active` to verify regions from client

### Issue: Haversine calculation seems inaccurate
**Solution**:
1. Ensure coordinates are in correct format: lat [-90, 90], lng [-180, 180]
2. Verify radius is in kilometers
3. Test with known distances using an online calculator

### Issue: No response from getActiveRegions endpoint
**Solution**:
1. Ensure at least one region is created
2. Check region.isActive = true
3. Verify endpoint path: `GET /api/v1/trips/regions/active`

---

## Support & Questions

For questions or issues: Check the implementation in `src/utils/location.js` and `src/modules/trips/trips.service.js`
