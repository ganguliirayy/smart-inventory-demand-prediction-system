# RxFlow AI - Backend API Documentation

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the server directory (see `.env.example`):

```env
MONGO_URI=mongodb://localhost:27017/rxflow_db
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

---

## 📚 API Endpoints

### Health Check
- **GET** `/api/health` - Server health status

### Authentication

#### Register
- **POST** `/api/auth/register`
- Body: `{ name, email, password, role?, phone? }`
- Returns: JWT token + user data

#### Login
- **POST** `/api/auth/login`
- Body: `{ email, password }`
- Returns: JWT token + user data

#### Get Current User
- **GET** `/api/auth/me` *(Protected)*

#### Update Profile
- **PUT** `/api/auth/updateprofile` *(Protected)*
- Body: `{ name?, role?, phone?, pharmacy? }`

#### Change Password
- **PUT** `/api/auth/changepassword` *(Protected)*
- Body: `{ currentPassword, newPassword, confirmPassword }`

#### Logout
- **POST** `/api/auth/logout` *(Protected)*

---

### Medicines Management

#### Get All Medicines
- **GET** `/api/medicines?category=&schedule=&search=&stockStatus=&expiryFilter=&page=1&limit=20&sortBy=name` *(Protected)*
- Filters:
  - `category`: OTC | Schedule H | Schedule H1 | Schedule X
  - `schedule`: same as category
  - `search`: Text search (name, generic name, batch, manufacturer)
  - `stockStatus`: `out` | `low`
  - `expiryFilter`: `expired` | `30` | `90`
  - `sortBy`: `name` | `expiry` | `stock` | `price`

#### Get Medicine Dashboard Stats
- **GET** `/api/medicines/dashboard/stats` *(Protected)*
- Returns: Inventory value, profit, expired count, etc.

#### Get Single Medicine
- **GET** `/api/medicines/:id` *(Protected)*

#### Create Medicine
- **POST** `/api/medicines` *(Protected)*
- Body: `{ name, genericName, manufacturer, category, schedule, batchNumber, expiryDate, mrp, purchasePrice, sellingPrice, stockQty, reorderLevel }`

#### Update Medicine
- **PUT** `/api/medicines/:id` *(Protected)*
- Body: Any updatable fields

#### Delete Medicine (Soft Delete)
- **DELETE** `/api/medicines/:id` *(Protected)*

---

### Sales Management

#### Record Sale
- **POST** `/api/sales` *(Protected)*
- Body: `{ medicineId, qty, patientName?, notes? }`
- Automatically updates stock and creates activity log

#### Get Sales
- **GET** `/api/sales?limit=100&page=1&startDate=&endDate=` *(Protected)*

#### Get Sales Summary
- **GET** `/api/sales/stats/summary` *(Protected)*
- Returns: Today's revenue/profit, month's data, total sales count

#### Get Detailed Analytics
- **GET** `/api/sales/analytics/detailed` *(Protected)*
- Returns: Comprehensive analytics with trends and top medicines

#### Cancel Sale
- **PUT** `/api/sales/:id/cancel` *(Protected)*
- Cancels within 24 hours and restores stock

---

### Demand Predictions

#### Predict Demand for Medicine
- **GET** `/api/predictions/medicine/:medicineId` *(Protected)*
- Returns: Demand forecast, stock adequacy, reorder recommendation

#### Get All Reorder Recommendations
- **GET** `/api/predictions/recommendations/all` *(Protected)*
- Returns: Medicines to reorder, grouped by priority

#### Get Category Trends
- **GET** `/api/predictions/trends/category` *(Protected)*
- Returns: Revenue, profit, units sold per category

#### Get Low Stock Alerts
- **GET** `/api/predictions/alerts/low-stock` *(Protected)*
- Returns: Medicines with critical/urgent reorder needs

---

### Activity Log

#### Get Activities
- **GET** `/api/activities?limit=50` *(Protected)*

#### Clear Activity Log
- **DELETE** `/api/activities/clear` *(Protected)*

---

## 🔐 Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

Token expires in 7 days by default.

---

## 📊 Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  phone: String,
  license: String,
  pharmacy: {
    storeName, address, city,
    pincode, gstNumber, etc.
  }
}
```

### Medicine
```javascript
{
  user: ObjectId (reference),
  name, genericName, manufacturer,
  category, schedule, batchNumber,
  expiryDate, mrp, purchasePrice,
  sellingPrice, stockQty, reorderLevel,
  storageCondition, requiresPrescription,
  isActive: Boolean
}
```

### Sale
```javascript
{
  user: ObjectId,
  medicine: ObjectId,
  medicineName, genericName, category,
  batchNumber, qty, revenue, profit,
  gstAmount, patientName, notes,
  soldAt, cancelled, cancelledAt
}
```

### Activity
```javascript
{
  user: ObjectId,
  type: String (add, edit, delete, sell, restock, alert),
  message: String,
  icon: String,
  color: String,
  meta: Object
}
```

---

## ✅ Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": { "field": "error message" }
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `404`: Not Found
- `409`: Conflict (Duplicate)
- `500`: Server Error

---

## 🛡️ Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Rate limiting (15 req/15min for general, 5 attempts/15min for auth)
- ✅ Input validation & sanitization
- ✅ CORS protection
- ✅ SQL injection prevention via Mongoose
- ✅ Error handler middleware
- ✅ Graceful shutdown handling

---

## 🔄 Prediction Algorithm

The system uses a **Moving Average + Trend Analysis** model:

1. **Historical Analysis**: Last 90 days of sales
2. **Trend Detection**: Compare recent 15 days vs older 15 days
3. **Demand Calculation**: Adjusted for trend (±15% or stable)
4. **Confidence Score**: Based on sales history volume
5. **Stock Adequacy**: Days of supply remaining

### Demand Levels
- **HIGH**: Recent avg > 0.7 × 100 units/day
- **MEDIUM**: Recent avg > 0.4 × 100 units/day
- **LOW**: Otherwise

---

## 📈 Key Metrics

### Dashboard Stats
- Total medicines in inventory
- Inventory value (purchase price)
- Retail value potential (MRP)
- Gross profit potential
- Out of stock count
- Low stock count
- Expiring medicines (30/90 days)
- Expired medicines
- Critical alerts count

### Sales Analytics
- Daily/Weekly/Monthly revenue & profit
- Average order value
- Profit margin %
- Top 10 medicines by revenue
- Category-wise trends
- Year-to-date performance

---

## 🚀 Production Deployment

1. **Environment Variables**
   - Use strong JWT_SECRET
   - Set NODE_ENV=production
   - Use production MongoDB URI

2. **Database**
   - Enable authentication
   - Create indexes for queries
   - Regular backups

3. **Security**
   - HTTPS only
   - Updated dependencies
   - Monitor rate limits
   - Log all errors

4. **Performance**
   - Enable compression
   - Database query optimization
   - Caching layer (Redis)
   - CDN for static files

---

## 📞 Support

For issues or questions, contact development team.

**Last Updated:** March 2026
**Version:** 2.0.0
