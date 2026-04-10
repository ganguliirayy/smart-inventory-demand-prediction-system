# RxFlow AI - Smart Inventory & Demand Prediction System

## Backend Server

A professional, production-ready backend for a smart pharmacy inventory management system with AI-powered demand predictions.

---

## 🎯 Features

### 📦 Inventory Management
- ✅ Complete CRUD operations for medicines
- ✅ Batch tracking and expiry management
- ✅ Real-time stock level monitoring
- ✅ Low stock and expiry alerts
- ✅ Medicine categorization (Antibiotics, Analgesics, etc.)
- ✅ Regulatory compliance (Schedule tracking: OTC, H, H1, X)
- ✅ Multi-location rack management

### 💰 Sales & Revenue Tracking
- ✅ Point-of-sale recording with instant stock deduction
- ✅ Revenue and profit calculations
- ✅ GST computation and tracking
- ✅ Patient name logging
- ✅ Sale cancellation with auto-stock restoration (24-hour window)
- ✅ Comprehensive sales analytics

### 🤖 Demand Prediction Engine
- ✅ 30/90-day moving average analysis
- ✅ Trend detection (increasing/decreasing/stable)
- ✅ Stock adequacy calculations
- ✅ Reorder recommendations (auto-prioritized)
- ✅ Category-wise demand trends
- ✅ Critical low-stock alerts
- ✅ Days-to-stockout calculations

### 📊 Analytics & Insights
- ✅ Real-time dashboard statistics
- ✅ Daily/Weekly/Monthly revenue & profit reports
- ✅ Top medicines by revenue
- ✅ Profit margin calculations
- ✅ Category performance analysis
- ✅ Year-to-date metrics
- ✅ Comparison analysis (Today vs Yesterday, etc.)

### 🔐 Security & Authentication
- ✅ JWT-based authentication (7-day expiry)
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Rate limiting (15 req/15min general, 5 auth attempts/15min)
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Role-based access control ready
- ✅ Token-based authorization

### 📋 Activity Logging
- ✅ Complete audit trail of all operations
- ✅ Color-coded activity types
- ✅ Rich metadata tracking
- ✅ User activity history

---

## 🛠️ Tech Stack

- **Node.js** + **Express.js** - Server framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM with schema validation
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-rate-limit** - DOS protection
- **CORS** - Cross-origin support
- **Nodemon** - Development hot-reload

---

## 📦 Installation

### Prerequisites
- Node.js 16+  
- npm 8+
- MongoDB running locally or remote

### Setup Steps

1. **Clone and navigate:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Or start production:**
   ```bash
   npm start
   ```

Server runs on `http://localhost:5000` by default.

---

## 🔑 Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/rxflow_db

# JWT
JWT_SECRET=your-secure-secret-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Frontend
CORS_ORIGIN=http://localhost:5173
```

---

## 📚 API Overview

### Authentication Routes
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update profile
- `PUT /api/auth/changepassword` - Change password

### Medicine Routes
- `GET /api/medicines` - List medicines (with filters, pagination, sorting)
- `GET /api/medicines/dashboard/stats` - Dashboard statistics
- `GET /api/medicines/:id` - Get single medicine
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Sales Routes
- `GET /api/sales` - Get sales history
- `GET /api/sales/stats/summary` - Sales summary
- `GET /api/sales/analytics/detailed` - Detailed analytics
- `POST /api/sales` - Record a sale
- `PUT /api/sales/:id/cancel` - Cancel sale (within 24 hours)

### Predictions Routes
- `GET /api/predictions/medicine/:id` - Demand forecast for medicine
- `GET /api/predictions/recommendations/all` - Reorder recommendations
- `GET /api/predictions/trends/category` - Category-wise trends
- `GET /api/predictions/alerts/low-stock` - Critical alerts

### Activity Routes
- `GET /api/activities` - Activity log
- `DELETE /api/activities/clear` - Clear activity log

**Full API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  phone: String,
  license: String,
  pharmacy: Object {
    storeName, address, city, pincode, etc.
  }
}
```

### Medicine Model  
```javascript
{
  user: ObjectId,
  name: String,
  genericName: String,
  manufacturer: String,
  category: String,
  schedule: String (OTC | Schedule H | H1 | X),
  batchNumber: String (unique per user),
  expiryDate: Date,
  mrp: Number,
  purchasePrice: Number,
  sellingPrice: Number,
  stockQty: Number,
  reorderLevel: Number,
  gstRate: Number,
  isActive: Boolean
}
```

### Sale Model
```javascript
{
  user: ObjectId,
  medicine: ObjectId,
  qty: Number,
  revenue: Number,
  profit: Number,
  gstAmount: Number,
  patientName: String,
  notes: String,
  soldAt: Date,
  cancelled: Boolean,
  cancelledAt: Date
}
```

### Activity Model
```javascript
{
  user: ObjectId,
  type: String,
  message: String,
  icon: String,
  color: String,
  meta: Object,
  createdAt: Date
}
```

---

## 🤖 Prediction Algorithm

The demand prediction engine uses **Statistical Moving Average + Trend Analysis**:

### Process
1. **Historical Analysis**: Analyzes last 90 days of sales
2. **Moving Average**: Calculates 30-day average demand
3. **Trend Detection**: Compares recent 15 days vs older 15 days
4. **Adjustment**: Applies trend multiplier (1.15× for increasing, 0.85× for decreasing)
5. **Confidence**: Scores based on sales history volume
6. **Adequacy**: Calculates days of remaining supply

### Demand Levels
- **HIGH**: Average > 70 units/day
- **MEDIUM**: Average > 40 units/day  
- **LOW**: Otherwise

### Stock Status
- **CRITICAL**: 0-7 days of supply
- **URGENT**: 7-14 days
- **WARNING**: 14-30 days
- **OPTIMAL**: 30+ days

---

## 🚀 Deployment

### Production Checklist
- [ ] Use strong `JWT_SECRET` (32+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB with auth
- [ ] Enable HTTPS
- [ ] Configure rate limits appropriately
- [ ] Set up logging
- [ ] Enable database backups
- [ ] Configure CORS for production domain
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Use process manager (PM2)

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Pharmacist",
    "email": "john@pharmacy.com",
    "password": "SecurePass123"
  }'
```

### Record Sale
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medicineId": "64f7a1b2c3d4e5f6g7h8i9j0",
    "qty": 2,
    "patientName": "Patient Name"
  }'
```

---

## 🔒 Security Features

- ✅ **Password Security**: Bcryptjs with 10 salt rounds
- ✅ **JWT Tokens**: 7-day expiration
- ✅ **Rate Limiting**: DOS prevention
- ✅ **Input Sanitization**: XSS prevention
- ✅ **Validation**: All inputs validated
- ✅ **Error Handling**: Generic error messages (no info leakage)
- ✅ **CORS**: Restricted origins
- ✅ **Dependencies**: Regular updates

---

## 📈 Performance Optimizations

- ✅ Database indexing on frequently queried fields
- ✅ Pagination for large result sets (default 20, max 100)
- ✅ Lean queries where possible
- ✅ Async/await for non-blocking operations
- ✅ Connection pooling via Mongoose
- ✅ Error handling with try-catch blocks

---

## 📝 Middleware

- **protect** - JWT authentication
- **errorHandler** - Centralized error handling
- **rateLimit** - DOS/brute-force protection
- **CORS** - Cross-origin requests

---

## 🐛 Error Handling

All errors return structured JSON:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "errors": { "field": "Field-specific error" }
}
```

Status codes:
- `200` - Success
- `201` - Created
- `400` - Validation Error
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

---

## 📚 Project Structure

```
server/
├── config/
│   └── db.js                    # MongoDB connection
├── middleware/
│   ├── auth.js                  # JWT authentication
│   ├── errorHandler.js          # Error handling
│   └── rateLimit.js             # Rate limiting
├── models/
│   ├── User.js                  # User schema
│   ├── Medicine.js              # Medicine schema
│   ├── Sale.js                  # Sale schema
│   └── Activity.js              # Activity schema
├── routes/
│   ├── auth.js                  # Auth endpoints
│   ├── medicines.js             # Medicine endpoints
│   ├── sales.js                 # Sales endpoints
│   ├── activities.js            # Activity endpoints
│   └── predictions.js           # Prediction endpoints
├── utils/
│   ├── validators.js            # Input validation
│   ├── sanitizers.js            # Input sanitization
│   └── predictions.js           # Prediction algorithm
├── constants/
│   └── index.js                 # Constants
├── server.js                    # Main server file
├── .env                         # Environment variables
└── package.json                 # Dependencies
```

---

## 🚀 Getting Started with Frontend

The server integrates with the React frontend at `http://localhost:5173`

Make sure to:
1. Start backend on `http://localhost:5000`
2. Start frontend with `npm run dev` in client folder
3. Update CORS_ORIGIN if frontend port changes

---

## 📞 Support & Maintenance

- **Issue Reporting**: Check logs for details
- **Updates**: Run `npm update` regularly
- **Security**: `npm audit` for vulnerabilities
- **Performance**: Monitor MongoDB performance
- **Backups**: Regular database backups

---

## 📄 License

Proprietary - RxFlow AI System

---

## 👨‍💻 Development Notes

- Use nodemon for auto-restart in development
- MongoDB must be running before server start
- Token expires in 7 days, implement refresh token for production
- Consider caching for frequently accessed data
- Add request logging for production monitoring

---

**Last Updated:** March 2026  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
