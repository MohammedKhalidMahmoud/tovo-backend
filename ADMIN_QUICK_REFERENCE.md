# Admin Panel API - Quick Reference Guide

**Created:** February 28, 2025  
**Version:** 1.0  
**Status:** Complete & Ready for Implementation

---

## 📚 What You Have

This comprehensive package includes everything needed to implement the admin panel for your Tovo ride-hailing application:

### Documents Included

1. **ADMIN_API_DESIGN.md** (80+ Endpoints)
   - Complete RESTful API specification
   - Request/response schemas
   - Query parameters for all operations
   - Error handling standards
   - Response format guidelines

2. **ADMIN_IMPLEMENTATION_GUIDE.md** (Implementation Plan)
   - Architecture overview
   - Database schema enhancements
   - File structure and organization
   - Phased implementation approach
   - Testing and deployment strategy

3. **Code Examples**
   - `admin.routes.js` - Main router setup
   - `users/users.routes.js` - User management routes
   - `users/users.controller.js` - Controller example
   - `users/users.service.js` - Service layer example
   - `drivers/drivers.routes.js` - Driver management routes
   - `drivers/drivers.controller.js` - Driver controller
   - `pricing/pricing.routes.js` - Pricing management
   - `rides/rides.routes.js` - Rides management

---

## 🎯 Quick Start

### Step 1: Review Documentation
```
Read these in order:
1. ADMIN_IMPLEMENTATION_GUIDE.md (5-10 min read)
2. ADMIN_API_DESIGN.md (detailed reference)
3. Review code examples
```

### Step 2: Update Database
```prisma
# Add to prisma/schema.prisma

# Update enum
enum Role {
  user
  captain
  admin    // ← ADD THIS
}

# Add new models (see ADMIN_IMPLEMENTATION_GUIDE.md for full models)
model AdminUser { ... }
model Refund { ... }
model AuditLog { ... }
model SystemSetting { ... }
```

Run migrations:
```bash
npx prisma migrate dev --name add_admin_models
npx prisma generate
```

### Step 3: Create Admin Module
```bash
mkdir -p src/modules/admin/{users,drivers,rides,pricing,vehicles,support,analytics,settings}
```

### Step 4: Copy Code Files
```bash
# Copy the example files you've been given:
cp admin.routes.js src/modules/admin/
cp users/*.js src/modules/admin/users/
cp drivers/*.js src/modules/admin/drivers/
# ... and so on for other modules
```

### Step 5: Update Main App
```javascript
// In src/app.js

const adminRoutes = require('./modules/admin/admin.routes');

// After other routes:
app.use(`${API}/admin`, adminRoutes);
```

### Step 6: Test Endpoints
```bash
npm run dev

# Test with Postman or curl:
curl http://localhost:3000/api/v1/admin/health \
  -H "Authorization: Bearer <admin_token>"
```

---

## 📋 API Endpoints Overview

### Users Management (11 endpoints)
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/users/:userId` - Get user details
- `PUT /api/v1/admin/users/:userId` - Update user
- `POST /api/v1/admin/users/:userId/suspend` - Suspend/unsuspend
- `POST /api/v1/admin/users/:userId/refund` - Issue refund
- `POST /api/v1/admin/users/:userId/reset-password` - Reset password
- `DELETE /api/v1/admin/users/:userId` - Delete user

### Drivers Management (10 endpoints)
- `GET /api/v1/admin/drivers` - List drivers
- `GET /api/v1/admin/drivers/:driverId` - Get driver details
- `PUT /api/v1/admin/drivers/:driverId` - Update driver
- `POST /api/v1/admin/drivers/:driverId/approve` - Approve verification
- `POST /api/v1/admin/drivers/:driverId/reject` - Reject application
- `POST /api/v1/admin/drivers/:driverId/suspend` - Suspend/unsuspend
- `POST /api/v1/admin/drivers/:driverId/refund` - Issue refund
- `POST /api/v1/admin/drivers/:driverId/reset-password` - Reset password
- `DELETE /api/v1/admin/drivers/:driverId` - Delete driver

### Rides Management (6 endpoints)
- `GET /api/v1/admin/rides` - List rides
- `GET /api/v1/admin/rides/:rideId` - Get ride details
- `POST /api/v1/admin/rides/:rideId/cancel` - Cancel ride
- `GET /api/v1/admin/rides/search/advanced` - Advanced search
- `GET /api/v1/dashboard/admin-dashboard` - Dashboard summary (admin-only)
- `GET /api/v1/ride-requests/riderequest-list` - Ride request listing
- `GET /api/v1/rides/upcoming` - Upcoming rides list
- `GET /api/v1/admin/rides/export` - Export data

### Pricing Management (9 endpoints)
- Price Plans: CRUD + list
- Promotions: Create, update, deactivate
- Coupons: Create, list, retrieve, update, delete (admin endpoints under /promotions/coupons)

### Vehicles Management (10 endpoints)
- Vehicle Types: CRUD + list
- Vehicles: List, get, update, verify, deactivate
- Inspections: Schedule

### Support & Complaints (7 endpoints)
- Tickets: List, get, update status
- Messages: Add to ticket
- Resolution: Resolve, close tickets
- Export tickets

### Analytics & Reports (6 endpoints)
- Dashboard summary
- User analytics
- Driver analytics
- Ride analytics
- Financial reports
- Complaint analytics

### System Settings (10 endpoints)
- Settings: Get, update
- Feature flags
- Content moderation
- Audit logs
- Health check
- Backup management

**Total: 80+ Endpoints**

---

## 🔑 Key Features

### User Management
✅ CRUD Operations  
✅ Suspend/Unsuspend  
✅ Reset Passwords  
✅ Issue Refunds  
✅ Search & Filter  
✅ Export Data  

### Driver Management
✅ CRUD Operations  
✅ Approve/Reject Verification  
✅ Suspend/Unsuspend  
✅ Issue Refunds  
✅ Document Verification  
✅ Insurance & License Tracking  

### Ride Management
✅ List & Detail Views  
✅ Cancel Rides  
✅ Issue Refunds  
✅ Advanced Filtering  
✅ Export Data  

### Pricing Management
✅ Price Plan CRUD  
✅ Promotion Management  
✅ Coupon Code Management  
✅ Usage Tracking  

### Vehicle Management
✅ Vehicle Type Management  
✅ Vehicle Registration  
✅ Document Verification  
✅ Inspection Scheduling  

### Support Management
✅ Ticket Management  
✅ Message System  
✅ Resolution Tracking  
✅ Priority Management  

### Analytics
✅ Dashboard Summaries  
✅ User Metrics  
✅ Driver Metrics  
✅ Financial Reports  
✅ Custom Exports  

### System Settings
✅ Configuration Management  
✅ Feature Flags  
✅ Audit Logging  
✅ Health Monitoring  

---

## 🔐 Security Features

### Authentication
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Admin-only endpoints
- ✅ Permission-based actions

### Data Protection
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (sanitization)
- ✅ CSRF protection
- ✅ Rate limiting

### Audit & Compliance
- ✅ Complete audit logging
- ✅ Admin action tracking
- ✅ IP address logging
- ✅ Data export compliance
- ✅ Backup management

---

## 📊 Database Schema Changes

### New Tables
1. **AdminUser** - Admin account management
2. **Refund** - Refund transaction tracking
3. **AuditLog** - Admin action audit trail
4. **SystemSetting** - System configuration

### Updated Tables
- Add `admin` to Role enum
- Add refund relationship to User and Captain models
- Add audit logging fields where needed

See: ADMIN_IMPLEMENTATION_GUIDE.md for complete schema

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database schema updates
- [ ] Admin middleware setup
- [ ] Users management (basic)
- [ ] Testing

### Phase 2: Core Modules (Week 2-3)
- [ ] Drivers management
- [ ] Rides management
- [ ] Pricing management
- [ ] Vehicles management

### Phase 3: Advanced Features (Week 4)
- [ ] Support ticket management
- [ ] Analytics & reports
- [ ] System settings
- [ ] Audit logging

### Phase 4: Quality Assurance (Week 5)
- [ ] Unit testing
- [ ] Integration testing
- [ ] Security testing
- [ ] Documentation

### Phase 5: Deployment (Week 6)
- [ ] Pre-deployment checklist
- [ ] Database migration
- [ ] Code deployment
- [ ] Monitoring setup

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* resource data */ },
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
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "status": 400,
    "details": "Additional details"
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

## 🛠️ Development Setup

### Required Tools
- Node.js 16+
- MySQL 8.0+
- Prisma CLI
- Postman (for API testing)
- Git

### Installation
```bash
# Install dependencies
npm install

# Update Prisma
npm install @prisma/client

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables
```bash
# .env file needs
DATABASE_URL=mysql://user:password@localhost:3306/tovo
PORT=3000
JWT_SECRET=your_secret_key
JWT_EXPIRY=1440  # minutes
```

---

## 🧪 Testing Endpoints

### Using Postman
1. Download/Open Postman
2. Create new collection "Tovo Admin"
3. Create requests for each endpoint
4. Set Authorization header: `Bearer <admin_token>`
5. Test with various filters and parameters

### Using cURL
```bash
# List users
curl http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Get user details
curl http://localhost:3000/api/v1/admin/users/user-id \
  -H "Authorization: Bearer <token>"

# Suspend user
curl -X POST http://localhost:3000/api/v1/admin/users/user-id/suspend \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "suspend",
    "reason": "Violating terms",
    "durationDays": 30
  }'
```

### Using JavaScript (Fetch)
```javascript
// Get admin token
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@tovo.com', password: 'password' })
});
const { data: { token } } = await response.json();

// List users
const users = await fetch('http://localhost:3000/api/v1/admin/users?page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await users.json();
console.log(data);
```

---

## 📖 Documentation References

### API Documentation
- **ADMIN_API_DESIGN.md** - Complete endpoint specifications
- Swagger UI available at: `/api/docs`

### Implementation Guide
- **ADMIN_IMPLEMENTATION_GUIDE.md** - Architecture & setup
- Includes database schema, file structure, phases, testing

### Code Examples
- `admin/users/` - Full example implementation
- `admin/drivers/` - Another complete module
- `admin/pricing/` - Pricing management example
- `admin/rides/` - Rides management example

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Unauthorized" error on /admin endpoints**
- Solution: Ensure JWT token is valid and user has admin role
- Check: `Authorization: Bearer <token>` header is present

**Issue: Database connection error**
- Solution: Verify DATABASE_URL in .env
- Check: MySQL server is running
- Run: `npx prisma db push`

**Issue: Validation errors**
- Solution: Check request body matches schema
- Review: Validation rules in routes files
- Example: email must be valid, UUID fields must be UUID format

**Issue: Missing pagination headers**
- Solution: Confirm routes set response headers
- Check: res.set() calls in controllers

**Issue: Refund not updating wallet**
- Solution: Ensure wallet exists (create if needed)
- Check: Transaction logic in service layer

---

## 📞 Support & Questions

### Refer to:
1. **ADMIN_API_DESIGN.md** for endpoint details
2. **ADMIN_IMPLEMENTATION_GUIDE.md** for setup
3. Code examples in `/admin/` folder
4. Prisma documentation: https://www.prisma.io/docs/
5. Express documentation: https://expressjs.com/

### Common References
- Response schemas - See ADMIN_API_DESIGN.md
- Database models - ADMIN_IMPLEMENTATION_GUIDE.md
- Authentication - See example controllers
- Middleware - src/middleware/auth.middleware.js

---

## ✅ Pre-Implementation Checklist

- [ ] Read ADMIN_IMPLEMENTATION_GUIDE.md
- [ ] Review ADMIN_API_DESIGN.md endpoint specs
- [ ] Update Prisma schema with new models
- [ ] Run database migrations
- [ ] Create admin module directory structure
- [ ] Copy and adapt code examples
- [ ] Update app.js with admin routes
- [ ] Test endpoints with Postman
- [ ] Implement remaining modules (structure provided)
- [ ] Add unit tests
- [ ] Set up error handling
- [ ] Configure logging
- [ ] Deploy to staging
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment

---

## 🎓 Learning Path

### For New Contributors
1. Review the existing route structure in `/src/modules/users/`
2. Read the example implementations for users/drivers
3. Follow the MVC pattern (Routes → Controller → Service → Repository)
4. Use Prisma for database operations
5. Validate all inputs with express-validator
6. Return standardized response format

### Key Concepts
- **Routes**: Handle HTTP requests, validation
- **Controllers**: Process requests, call services
- **Services**: Business logic, data transformation
- **Repository**: Database queries with Prisma
- **Middleware**: Authentication, authorization, validation

---

## 🚀 Next Steps

1. **Review the Documents**
   - Start with ADMIN_IMPLEMENTATION_GUIDE.md
   - Reference ADMIN_API_DESIGN.md as needed

2. **Set Up Database**
   - Add new models to prisma/schema.prisma
   - Run migrations

3. **Create Module Structure**
   - Create directories for each admin module
   - Copy provided code examples
   - Adapt as needed

4. **Implement Endpoints**
   - Follow the MVC pattern
   - Use provided examples as templates
   - Implement one module at a time

5. **Test Thoroughly**
   - Unit tests for each service
   - Integration tests for endpoints
   - Security testing

6. **Deploy**
   - Staging environment first
   - Production deployment
   - Monitor and fix issues

---

## 📅 Timeline Estimate

- **Week 1**: Database setup + Users module = 40 hours
- **Week 2**: Drivers + Rides modules = 35 hours
- **Week 3**: Pricing + Vehicles + Support = 40 hours
- **Week 4**: Analytics + Settings + Testing = 40 hours
- **Week 5**: Optimization + Documentation = 30 hours

**Total**: ~185 hours (estimate for team of developers)

---

## 💡 Pro Tips

### Development
- Use TypeScript for better type safety
- Implement error handling consistently
- Add logging for debugging
- Write unit tests as you go
- Keep controllers thin, logic in services

### Database
- Create indexes on frequently searched fields
- Use transactions for multi-step operations
- Implement soft deletes if needed
- Keep audit logs
- Regular backups

### Security
- Validate all inputs strictly
- Sanitize outputs
- Use HTTPS in production
- Implement rate limiting
- Log unauthorized access attempts

### Performance
- Use pagination (never return all records)
- Cache frequently accessed data (Redis)
- Use database indexes
- Lazy load relationships
- Monitor slow queries

---

**Document Version:** 1.0  
**Last Updated:** February 28, 2025  
**Status:** Complete & Ready  

For detailed specifications, see **ADMIN_API_DESIGN.md**  
For implementation guide, see **ADMIN_IMPLEMENTATION_GUIDE.md**
