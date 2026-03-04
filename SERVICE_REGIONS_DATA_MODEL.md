# Service Regions Data Model

## Database Schema

### Region Table
After migration `20260304_add_radius_to_regions`

```sql
CREATE TABLE `regions` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191),
  `lat` DOUBLE,
  `lng` DOUBLE,
  `radius` DOUBLE,                    -- NEW COLUMN: Radius in kilometers
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Prisma Model
```prisma
model Region {
  id        String   @id @default(uuid())
  name      String
  country   String
  city      String?
  lat       Float?
  lng       Float?
  radius    Float?   // Radius in kilometers for circular service area
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("regions")
}
```

---

## Data Examples

### Sample Region Records

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Downtown Cairo",
    "country": "Egypt",
    "city": "Cairo",
    "lat": 30.0444,
    "lng": 31.2357,
    "radius": 25.5,
    "isActive": true,
    "createdAt": "2026-03-04T10:00:00.000Z",
    "updatedAt": "2026-03-04T10:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Giza Plateau",
    "country": "Egypt",
    "city": "Giza",
    "lat": 30.0131,
    "lng": 31.2089,
    "radius": 20.0,
    "isActive": true,
    "createdAt": "2026-03-04T10:05:00.000Z",
    "updatedAt": "2026-03-04T10:05:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Helwan",
    "country": "Egypt",
    "city": "Helwan",
    "lat": 29.8627,
    "lng": 31.3397,
    "radius": 15.0,
    "isActive": true,
    "createdAt": "2026-03-04T10:10:00.000Z",
    "updatedAt": "2026-03-04T10:10:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "name": "Alexandria Branch (Inactive)",
    "country": "Egypt",
    "city": "Alexandria",
    "lat": 31.2001,
    "lng": 29.9187,
    "radius": 30.0,
    "isActive": false,
    "createdAt": "2026-03-04T10:15:00.000Z",
    "updatedAt": "2026-03-04T11:00:00.000Z"
  }
]
```

---

## Coordinate Reference

### Cairo Metro Area Coordinates
```
Downtown Cairo:         30.0444°N, 31.2357°E
Giza Plateau:          30.0131°N, 31.2089°E
Zamalek Island:        30.0733°N, 31.2678°E
Helwan:                29.8627°N, 31.3397°E
New Cairo (5th):       30.0269°N, 31.4946°E
Nasr City:             30.0808°N, 31.3753°E
```

### Real-World Distance Examples

| From | To | Distance |
|------|-----|----------|
| Downtown Cairo (30.0444, 31.2357) | Giza (30.0131, 31.2089) | ~6.5 km |
| Zamalek (30.0733, 31.2678) | Helwan (29.8627, 31.3397) | ~28 km |
| Downtown (30.0444, 31.2357) | New Cairo (30.0269, 31.4946) | ~16 km |

---

## Relationships

### Trip → Region Validation
Every trip created checks against active regions:
```
Trip.pickupLat, Trip.pickupLng → Match Against All Active Regions
                              ↓
                        Point in Circle?
                       ↙              ↖
                    YES              NO
                    ↓                ↓
              Create Trip      Reject with 422
```

---

## Query Examples

### Get All Active Regions
```sql
SELECT id, name, lat, lng, radius
FROM regions
WHERE isActive = true
ORDER BY name ASC;
```

### Find Regions Covering a Point
```javascript
// Application logic (Haversine)
const activeRegions = await prisma.region.findMany({
  where: { isActive: true }
});

const coveringRegions = activeRegions.filter(region =>
  distance(pickupLat, pickupLng, region.lat, region.lng) <= region.radius
);
```

### Update Region Radius
```javascript
await prisma.region.update({
  where: { id: regionId },
  data: { radius: newRadius }
});
```

### Deactivate Region
```javascript
await prisma.region.update({
  where: { id: regionId },
  data: { isActive: false }
});
```

---

## Migration History

### Migration 1: add_radius_to_regions
**Date**: March 4, 2026
**Changes**:
- Added DOUBLE column `radius` (nullable)
- For existing regions, `radius` will be NULL
- Trips can be created without limits until radius is set

**File**: `prisma/migrations/20260304_add_radius_to_regions/migration.sql`

---

## Constraints & Validation

### Field Constraints
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `name` | String | NOT NULL | Region name |
| `country` | String | NOT NULL | Country code/name |
| `city` | String | NULLABLE | Optional city |
| `lat` | Float | -90 to 90 | Latitude |
| `lng` | Float | -180 to 180 | Longitude |
| `radius` | Float | > 0 | Radius in km |
| `isActive` | Boolean | DEFAULT true | Soft delete via flag |
| `createdAt` | DateTime | NOT NULL | Creation timestamp |
| `updatedAt` | DateTime | NOT NULL | Last update timestamp |

### Application Validation
In `regions.routes.js`:
```javascript
body('radius').optional().isFloat({ min: 0.1 })
  .withMessage('radius must be a positive number (in km)')
```

---

## Indexes & Performance

### Current Indexes
- PRIMARY KEY on `id`
- Implicit index on `isActive` (recommended to add explicitly)

### Recommended Indexes
```sql
CREATE INDEX idx_regions_is_active ON regions(isActive);
CREATE INDEX idx_regions_country ON regions(country);
CREATE INDEX idx_regions_city ON regions(city);
```

### Query Performance
With active regions index:
- `SELECT * WHERE isActive = true`: ~O(1) with proper indexing
- Point-in-circle check: O(n) where n = number of active regions
- Expected: < 5ms for 100 regions

---

## Backup & Recovery

### Backup Query
```sql
SELECT * FROM regions 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY createdAt DESC;
```

### Important Data Fields to Monitor
- `name`: Unique per region
- `radius`: Critical for validation logic
- `isActive`: State management flag

---

## Future Schema Evolution

### Potential V2 Changes
```prisma
model Region {
  // ... existing fields ...
  
  // Polygon support (GeoJSON)
  polygon      JsonPolygon?
  
  // Pricing
  baseFare     Decimal?
  surgeMultiplier Float? @default(1.0)
  
  // Availability
  operatingHours OperatingHours?
  
  // Relationships
  services     Service[]
  allowedServices String[]? // JSON array
}
```

---

## Data Migration Guide

If moving from different region system:

```sql
-- Step 1: Add radius to existing regions (set to average service area)
UPDATE regions SET radius = 15.0 WHERE radius IS NULL;

-- Step 2: Verify data
SELECT COUNT(*) as total,
       COUNT(CASE WHEN radius > 0 THEN 1 END) as with_radius,
       AVG(radius) as avg_radius,
       MIN(radius) as min_radius,
       MAX(radius) as max_radius
FROM regions;

-- Step 3: Backup original for safety
CREATE TABLE regions_backup_v1 AS SELECT * FROM regions;
```

---

## Documentation

For more details, see:
- [SERVICE_REGIONS_IMPLEMENTATION.md](./SERVICE_REGIONS_IMPLEMENTATION.md) - Full implementation guide
- [SERVICE_REGIONS_QUICKREF.md](./SERVICE_REGIONS_QUICKREF.md) - Quick reference
