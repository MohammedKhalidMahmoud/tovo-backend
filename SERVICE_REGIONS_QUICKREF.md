# Service Regions - Quick Reference

## Quick Setup

### 1. Create a Region (Admin)
```bash
POST /api/v1/admin/regions
{
  "name": "Central Cairo",
  "country": "Egypt",
  "city": "Cairo",
  "lat": 30.0444,        # center latitude
  "lng": 31.2357,        # center longitude
  "radius": 15.5,        # radius in km
  "isActive": true
}
```

### 2. Get Active Regions (Public - No Auth)
```bash
GET /api/v1/trips/regions/active
```

### 3. Create a Trip (User)
```bash
POST /api/v1/trips
{
  "pickup_lat": 30.0444,     # Must be within a region
  "pickup_lng": 31.2357,
  "pickup_address": "...",
  "dropoff_lat": 30.1050,
  "dropoff_lng": 31.3100,
  "dropoff_address": "...",
  "service_id": "uuid",
  "payment_method_id": "uuid"
}
# ✅ Success: pickup_lat/lng within region
# ❌ 422 Error: pickup_lat/lng outside all regions
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/location.js` | Haversine distance calculation & point-in-circle logic |
| `src/modules/admin/regions/regions.service.js` | Region CRUD + `listActiveRegions()` |
| `src/modules/trips/trips.service.js` | Trip creation + `validatePickupInRegion()` |
| `prisma/schema.prisma` | Region model with `radius` field |

---

## Important Functions

### Location Utils
```javascript
const { haversineKm, isPointInCircle, findPointInRegions } = require('../../utils/location');

// Check if pickup (30.0444, 31.2357) is in region with center (30.0444, 31.2357) and 15km radius
const inRegion = isPointInCircle(30.0444, 31.2357, 30.0444, 31.2357, 15);

// Find which region contains the point
const matchingRegion = findPointInRegions(30.0444, 31.2357, activeRegions);
```

### Trip Validation
```javascript
// In trips.service.js
const createTrip = async (userId, body) => {
  // Service validation
  const svc = await serviceRepo.findById(service_id);
  
  // NEW: Region validation
  await validatePickupInRegion(body.pickup_lat, body.pickup_lng);
  
  // Fare calculation & trip creation
  return repo.createTrip({ ... });
};
```

---

## Common Operations

### List All Regions (Admin)
```javascript
GET /api/v1/admin/regions?page=1&limit=20
```

### List Active Regions (Public)
```javascript
GET /api/v1/trips/regions/active
```

### Update Region Radius
```javascript
PUT /api/v1/admin/regions/{id}
{ "radius": 20.0 }
```

### Deactivate Region
```javascript
PUT /api/v1/admin/regions/{id}
{ "isActive": false }
```

---

## Backward Compatibility

✅ **If no regions are defined**: All trips are allowed (backward compatible)
✅ **If regions exist**: Only trips with pickup within a region are allowed
✅ **Existing trips**: Not affected by region validation

---

## Performance

- Haversine: ~5 floating-point ops per region
- 100 regions: < 5ms calculation time
- Region fetch: Cached from DB on each trip (can optimize with Redis)

---

## Errors

| Scenario | Status | Message |
|----------|--------|---------|
| Pickup outside all regions | 422 | "Pickup location is outside all service regions..." |
| Invalid region definition | 422 | Validation error on region lat/lng |
| Service not found | 404 | "Service not found or inactive" |

---

## Testing

```bash
# Test with valid pickup (within 15km of 30.0444, 31.2357)
POST /api/v1/trips
{ "pickup_lat": 30.048, "pickup_lng": 31.239, ... }  # ✅ Success

# Test with invalid pickup (far away)
POST /api/v1/trips
{ "pickup_lat": 35.0, "pickup_lng": 35.0, ... }  # ❌ 422 Error
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Trip rejected when should be accepted | Verify region radius and center coordinates |
| Endpoint returns no regions | Check `isActive=true` on regions |
| Distance calculation wrong | Ensure lat in [-90,90], lng in [-180,180] |

---

## Next Steps

- [x] Basic circular regions
- [ ] Polygon regions (complex shapes)
- [ ] Region-specific pricing
- [ ] Surge pricing by region
- [ ] Multi-region service coverage
