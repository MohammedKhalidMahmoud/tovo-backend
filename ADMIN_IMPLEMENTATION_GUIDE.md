# Admin Panel Implementation Guide - Tovo Ride-Hailing Backend

**Version:** 1.0  
**Date:** February 28, 2025  
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a comprehensive implementation guide for the Tovo admin panel. The admin panel will enable system administrators to manage all aspects of the ride-hailing platform including users, drivers, rides, pricing, vehicles, complaints, and system settings.

### Key Deliverables
1. **ADMIN_API_DESIGN.md** - Complete RESTful API specifications with all 80+ endpoints
2. **Admin Routes Structure** - Modular implementation with clear separation of concerns
3. **Example Controllers & Services** - Sample implementations for users and drivers modules
4. **Prisma Schema Updates** - Database model enhancements needed
5. **Implementation Checklist** - Phased approach for rolling out admin features

---

## Project Analysis

### Current Architecture

Your Tovo backend is built with:
- **Framework:** Express.js
- **Database:** MySQL with Prisma ORM
- **Authentication:** JWT with role-based access control
- **Real-time:** Socket.io for live features
- **API Documentation:** Swagger/OpenAPI

**Current Modules:**
- Authentication (auth)
- Users Management (users)
- Drivers Management (captains)
- Trips/Rides Management (trips)
- Locations
- Vehicle Types
- Promotions
- Notifications
- Support/Tickets

---

## Database Schema Enhancements

### New Enum to Add

```prisma
enum Role {
  user
  captain
  admin      // ← ADD THIS
}
```

### New Models to Create

#### 1. AdminUser Model (if separate from User)
```prisma
model AdminUser {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  passwordHash    String
  role            String    // admin, super_admin, moderator
  permissions     Json      // Array of permission strings
  isActive        Boolean   @default(true)
  lastLogin       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  auditLogs       AuditLog[]

  @@map("admin_users")
}
```

#### 2. Refund Model
```prisma
model Refund {
  id            String    @id @default(uuid())
  userId        String?
  captainId     String?
  amount        Decimal   @db.Decimal(10, 2)
  currency      String
  reason        String
  notes         String?   @db.Text
  tripId        String?
  status        String    @default("pending")  // pending, completed, failed
  processedAt   DateTime?
  createdAt     DateTime  @default(now())
  
  user          User?     @relation(fields: [userId], references: [id])
  captain       Captain?  @relation(fields: [captainId], references: [id])

  @@map("refunds")
}
```

#### 3. AuditLog Model
```prisma
model AuditLog {
  id            String    @id @default(uuid())
  adminId       String
  action        String    // user_suspended, driver_approved, etc.
  entityType    String    // user, captain, trip, etc.
  entityId      String
  changes       Json      // Before and after values
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime  @default(now())
  
  admin         AdminUser @relation(fields: [adminId], references: [id])

  @@map("audit_logs")
}
```

#### 4. SystemSetting Model
```prisma
model SystemSetting {
  id            String    @id @default(uuid())
  key           String    @unique
  value         Json
  description   String?
  category      String    // general, pricing, features, security, etc.
  updatedBy     String?
  updatedAt     DateTime  @updatedAt
  
  @@map("system_settings")
}
```

#### 5. Promotion Model Enhancement
```prisma
model Promotion {
  // ... existing fields ...
  createdBy     String?
  updatedBy     String?
  totalUsage    Int       @default(0)
  lastUsedAt    DateTime?
  
  @@map("promotions")
}
```

---

## File Structure

```
src/modules/admin/
├── admin.routes.js                 # Main admin router
├── users/
│   ├── users.routes.js
│   ├── users.controller.js
│   ├── users.service.js
│   └── users.repository.js
├── drivers/
│   ├── drivers.routes.js
│   ├── drivers.controller.js
│   ├── drivers.service.js
│   └── drivers.repository.js
├── rides/
│   ├── rides.routes.js
│   ├── rides.controller.js
│   ├── rides.service.js
│   └── rides.repository.js
├── pricing/
│   ├── pricing.routes.js
│   ├── pricing.controller.js
│   ├── pricing.service.js
│   └── pricing.repository.js
├── vehicles/
│   ├── vehicles.routes.js
│   ├── vehicles.controller.js
│   ├── vehicles.service.js
│   └── vehicles.repository.js
├── support/
│   ├── support.routes.js
│   ├── support.controller.js
│   ├── support.service.js
│   └── support.repository.js
├── analytics/
│   ├── analytics.routes.js
│   ├── analytics.controller.js
│   ├── analytics.service.js
│   └── analytics.repository.js
└── settings/
    ├── settings.routes.js
    ├── settings.controller.js
    ├── settings.service.js
    └── settings.repository.js
```

---

## Implementation Architecture

### MVC Pattern per Module

Each admin module follows the **MVC pattern** with service layer:

```
Routes → Controller → Service → Repository → Database
  ↓         ↓           ↓           ↓            ↓
Validate  Transform   Business   Data Access   Prisma
 Input    Response    Logic      Abstraction    ORM
```

### Example Flow: List Users

```
GET /api/v1/admin/users?page=1&limit=20
         ↓
routes.js → validate query params
         ↓
controller.js → extract filters, call service
         ↓
service.js → build where clause, process data
         ↓
repository.js → execute Prisma queries
         ↓
Database → return results
```

---

## API Response Standards

### Success Response
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2025-02-28T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "User not found",
  "error": {
    "code": "USER_NOT_FOUND",
    "status": 404,
    "details": "No user found with ID: xyz"
  },
  "timestamp": "2025-02-28T10:30:00Z"
}
```

### Pagination Headers
```
X-Total-Count: 150
X-Total-Pages: 8
X-Current-Page: 1
X-Per-Page: 20
```

---

## Key Features by Module

### 1. Users Management
- ✅ List/Get/Update/Delete users
- ✅ Suspend/Unsuspend accounts
- ✅ Reset passwords
- ✅ Issue refunds
- ✅ View wallet balance
- ✅ Search and filter capabilities
- ✅ Export user data

### 2. Drivers Management
- ✅ List/Get/Update/Delete drivers
- ✅ Approve/Reject verification
- ✅ Suspend/Unsuspend accounts
- ✅ Issue refunds
- ✅ Manage vehicle assignments
- ✅ Track insurance & license expiry
- ✅ View earnings statistics
- ✅ Export driver data

### 3. Rides Management
- ✅ List/Get ride details
- ✅ Cancel rides with refunds
- ✅ Advanced filtering & search
- ✅ Export ride data
- ✅ View ride timeline
- ✅ Track payment status

### 4. Pricing Management
- ✅ CRUD Price Plans
- ✅ Create/Update Promotions
- ✅ Manage Coupon Codes
- ✅ Track promotion usage
- ✅ Monitor revenue impact
- ✅ Schedule promotions

### 5. Vehicles Management
- ✅ Manage Vehicle Types
- ✅ List/Get/Update Vehicles
- ✅ Document verification
- ✅ Schedule inspections
- ✅ Deactivate vehicles
- ✅ Track vehicle performance

### 6. Support & Complaints
- ✅ Manage support tickets
- ✅ Add messages/notes
- ✅ Resolve tickets
- ✅ Take actions (refund, warnings, suspensions)
- ✅ Assign to agents
- ✅ Export tickets
- ✅ Priority management

### 7. Analytics & Reports
- ✅ Dashboard summary
- ✅ User metrics
- ✅ Driver metrics
- ✅ Ride metrics
- ✅ Financial reports
- ✅ Complaint analytics
- ✅ Custom date ranges
- ✅ Export in multiple formats

### 8. System Settings
- ✅ Manage general settings
- ✅ Pricing configuration
- ✅ Feature flags
- ✅ Content moderation
- ✅ Audit logging
- ✅ Health monitoring
- ✅ Backup management

---

## Authentication & Authorization

### Middleware Update

Update your `auth.middleware.js` to support admin role:

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.actor || !roles.includes(req.actor.role)) {
      return forbidden(res, `Access restricted to: ${roles.join(', ')}`);
    }
    next();
  };
};

// Usage: authorize('admin') or authorize('admin', 'super_admin')
```

### Admin Permissions (Optional)

For granular control, implement permission system:

```javascript
const adminPermissions = {
  MANAGE_USERS: 'manage_users',
  MANAGE_DRIVERS: 'manage_drivers',
  MANAGE_RIDES: 'manage_rides',
  MANAGE_PRICING: 'manage_pricing',
  MANAGE_VEHICLES: 'manage_vehicles',
  MANAGE_SUPPORT: 'manage_support',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_ADMINS: 'manage_admins',
};

// Middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.actor.permissions.includes(permission)) {
      return forbidden(res, `Permission required: ${permission}`);
    }
    next();
  };
};
```

---

## Integration with Main App

### Update app.js

```javascript
// ── Route Imports ─────────────────────────────────────────────────────
const adminRoutes = require('./modules/admin/admin.routes');  // ADD THIS

// ── API Routes ────────────────────────────────────────────────────────
const API = '/api/v1';

// ... existing routes ...

app.use(`${API}/admin`, adminRoutes);  // ADD THIS
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Update Prisma schema with new models
- [ ] Create admin authentication middleware
- [ ] Set up admin module structure
- [ ] Implement users management (basic CRUD)
- [ ] Test endpoints with Postman

### Phase 2: Core Management (Week 2-3)
- [ ] Implement drivers management
- [ ] Implement rides management
- [ ] Implement pricing management
- [ ] Implement vehicles management
- [ ] Add comprehensive filtering & search

### Phase 3: Advanced Features (Week 4)
- [ ] Implement support ticket management
- [ ] Implement analytics & reports
- [ ] Implement system settings
- [ ] Add audit logging
- [ ] Add data export functionality

### Phase 4: Polish & Testing (Week 5)
- [ ] Unit tests for all modules
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Performance optimization
- [ ] Security hardening

### Phase 5: Frontend (Week 6+)
- [ ] Design admin panel UI
- [ ] Implement React/Vue admin dashboard
- [ ] Connect to backend APIs
- [ ] Add real-time features
- [ ] Deploy to production

---

## Testing Checklist

### Unit Tests
- [ ] Validation logic
- [ ] Data transformation
- [ ] Error handling
- [ ] Permission checks

### Integration Tests
- [ ] Full request-response cycle
- [ ] Database transactions
- [ ] Auth & authorization
- [ ] Error responses

### API Tests
- [ ] All CRUD endpoints
- [ ] Filtering & pagination
- [ ] Data export
- [ ] Rate limiting

### Security Tests
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts

---

## Performance Considerations

### Database Optimization
- Create indexes on frequently searched fields:
  ```sql
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_phone ON users(phone);
  CREATE INDEX idx_trips_status ON trips(status);
  CREATE INDEX idx_trips_createdAt ON trips(createdAt);
  CREATE INDEX idx_captains_email ON captains(email);
  ```

### Caching Strategy
- Cache dashboard summaries (5 min expiry)
- Cache feature settings (15 min expiry)
- Cache analytics (hourly expiry)
- Use Redis for session/token storage

### API Optimization
- Implement pagination (don't return all records)
- Use projections (only fetch needed fields)
- Lazy load relationships
- Implement request timeout
- Use database connection pooling

---

## Security Hardening

### Required Changes

1. **Input Validation**
   - Validate all input parameters
   - Sanitize string inputs
   - Check numeric ranges
   - Verify UUIDs

2. **SQL Injection Prevention**
   - Use Prisma parameterized queries (already done)
   - Never concatenate SQL strings
   - Validate enum values

3. **XSS Prevention**
   - Sanitize text inputs
   - Encode output properly
   - DOMPurify for HTML

4. **Rate Limiting**
   - 100 requests per 15 minutes (default)
   - 10 requests per minute for sensitive operations
   - 1 request per 5 seconds for refunds

5. **HTTPS Only**
   - Redirect HTTP to HTTPS
   - Set HSTS header
   - Use secure cookies

6. **Audit Logging**
   - Log all admin actions
   - Store IP address & user agent
   - Keep logs for 90 days
   - Secure log storage

---

## Monitoring & Logging

### Key Metrics to Monitor
- Request latency
- Error rate
- Database query performance
- Failed authentication attempts
- Unauthorized access attempts
- Large data exports
- Refund transactions

### Alerting Thresholds
- API response time > 1000ms
- Error rate > 1%
- Database queries > 5 seconds
- Failed logins > 5 in 15 min
- Refund value > $1000 at once

---

## Documentation Requirements

### API Documentation
- [ ] Swagger/OpenAPI spec updated
- [ ] All endpoints documented
- [ ] Example requests & responses
- [ ] Error codes documented

### Code Documentation
- [ ] JSDoc comments on all functions
- [ ] Complex logic explained
- [ ] Architecture diagrams
- [ ] Setup instructions

### User Documentation
- [ ] Admin panel user guide
- [ ] Feature explanations
- [ ] Troubleshooting guide
- [ ] FAQ section

---

## Deployment Considerations

### Pre-Production Checklist
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance tested (load testing)
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Logging configured

### Deployment Steps
1. Create database backup
2. Run migrations
3. Deploy new code
4. Smoke test endpoints
5. Monitor for errors
6. Gradually increase traffic
7. Keep rollback ready for 24 hours

---

## Future Enhancements

### Short Term (Next Month)
- [ ] Role-based permission system
- [ ] Multi-factor authentication (MFA)
- [ ] Bulk operations (import/export)
- [ ] Email templates management
- [ ] SMS templates management

### Medium Term (2-3 Months)
- [ ] Advanced analytics with charts
- [ ] Custom report builder
- [ ] Workflow automation
- [ ] Webhook support
- [ ] API key management

### Long Term (6+ Months)
- [ ] Machine learning for fraud detection
- [ ] Predictive analytics
- [ ] Mobile admin app
- [ ] Multi-language support
- [ ] Custom branding options

---

## Support & Maintenance

### Ongoing Tasks
- Monthly security updates
- Quarterly performance review
- Annual security audit
- Regular backups verification
- Log rotation

### Team Requirements
- 1 Full-stack Developer (initial setup & features)
- 1 QA Engineer (testing & validation)
- 1 DevOps Engineer (deployment & monitoring)
- 1 Product Manager (requirements & planning)

---

## References & Resources

### Files Included
1. **ADMIN_API_DESIGN.md** - Complete API specification (80+ endpoints)
2. **admin.routes.js** - Main router setup
3. **users/users.routes.js** - Example routes for users
4. **users/users.controller.js** - Example controller implementation
5. **users/users.service.js** - Example service with business logic
6. **drivers/drivers.routes.js** - Example routes for drivers
7. **drivers/drivers.controller.js** - Example controller for drivers

### Prisma Documentation
- https://www.prisma.io/docs/
- https://www.prisma.io/docs/orm/reference/prisma-schema-reference

### Express Best Practices
- https://expressjs.com/en/advanced/best-practice-security.html
- https://expressjs.com/en/api/

### Security Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html

---

## Questions & Support

For implementation questions:
1. Refer to ADMIN_API_DESIGN.md for endpoint specifications
2. Check example implementations in users/ and drivers/ modules
3. Review Prisma schema changes needed
4. Follow the phased implementation approach
5. Use the testing checklist for validation

---

**Document Version:** 1.0  
**Last Updated:** February 28, 2025  
**Next Review:** April 28, 2025
