# ShopEase Database Schema v2 - Professional POS System
## Migration Guide

### Overview
This migration transforms the database from a simple `orders` table to a professional, enterprise-grade POS system with:
- ✅ Multi-store support
- ✅ Guest sessions (frictionless checkout)
- ✅ Receipt lifecycle management
- ✅ Audit trails for compliance
- ✅ Bridge app integration
- ✅ Future sync capabilities

---

## 📋 Migration Files

### Phase 1: Create User Management
**File**: `002_new_schema_users.sql`
- Creates `users` table for both authenticated and guest users
- Supports future login features (Google, OTP, Phone)
- Includes indexes for fast lookups

### Phase 2: Create Guest Sessions
**File**: `003_new_schema_guest_sessions.sql`
- Creates `guest_sessions` table for frictionless shopping
- Links guest activity to stores
- Enables device tracking and fraud prevention

### Phase 3: Create Store Configuration
**File**: `004_new_schema_stores.sql`
- Creates `stores` table for multi-store support
- Stores POS configuration (type, API endpoint)
- Isolates each store's data

### Phase 4: Create Product Inventory
**File**: `005_new_schema_products.sql`
- Creates `products` table with barcode as primary ID
- Supports store-specific pricing and inventory
- Includes GST/HSN codes for tax compliance

### Phase 5: Create Receipt Core
**File**: `006_new_schema_receipts.sql`
- Creates `receipts` table (source of truth)
- Implements state lifecycle: OPEN → LOCKED → CONSUMED → EXPIRED
- Prevents double billing with unique receipt_code

### Phase 6: Create Receipt Items
**File**: `007_new_schema_receipt_items.sql`
- Creates `receipt_items` table for line items
- Immutable snapshot of product state at purchase time
- Includes tax calculation and HSN codes

### Phase 7: Create Audit Trail
**File**: `008_new_schema_receipt_events.sql`
- Creates `receipt_events` table for audit logging
- Tracks every state change for compliance
- Supports debugging and dispute resolution

### Phase 8: Create POS Device Registry
**File**: `009_new_schema_pos_devices.sql`
- Creates `pos_devices` table (Bridge app registration)
- Enables secure API key authentication
- Tracks device activity for monitoring

### Phase 9: Create Sync Tracking
**File**: `010_new_schema_sync_logs.sql`
- Creates `sync_logs` table for future sync agent
- Tracks product, price, and inventory updates
- Records sync success/failure for troubleshooting

---

## 🚀 How to Run Migrations

### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Click **SQL Editor** → **New Query**
3. Copy the entire contents from each migration file in order
4. Run each migration one by one

### Option 2: Using Node.js Script (Future)
```bash
cd smart-scan-backend
npm install
node run-migrations.js
```

### Option 3: Manual Order
Run migrations in this exact order:
1. `002_new_schema_users.sql`
2. `003_new_schema_guest_sessions.sql`
3. `004_new_schema_stores.sql`
4. `005_new_schema_products.sql`
5. `006_new_schema_receipts.sql`
6. `007_new_schema_receipt_items.sql`
7. `008_new_schema_receipt_events.sql`
8. `009_new_schema_pos_devices.sql`
9. `010_new_schema_sync_logs.sql`

---

## 📊 Data Flow Example (Real Life Scenario)

### 1. Customer enters store
```
→ guest_session CREATED (device_id, store_id)
```

### 2. Customer scans items (mobile app)
```
→ receipt CREATED with status='OPEN'
→ receipt_items inserted for each barcode scanned
→ receipt_events: CREATED event logged
```

### 3. Customer taps "Checkout" (mobile app)
```
→ receipt status changed to 'LOCKED'
→ barcode generated from receipt.receipt_code
→ receipt_events: LOCKED event logged (source='mobile')
```

### 4. Counter staff scans barcode (Bridge app)
```
→ Bridge app queries: GET /api/receipt/{receipt_code}
→ Fetches receipt + receipt_items + store details
→ receipt status changed to 'CONSUMED'
→ receipt_events: SCANNED, CONSUMED events logged (source='bridge')
```

### 5. Bridge app pastes items to POS
```
→ sync_logs: RECEIPT sync logged
→ POS system receives items and generates GST bill automatically
→ Success! No manual scanning needed
```

---

## 🔐 Security Implementation (Phase 2)

### Receipt Fetch Authorization
```sql
-- Only these receipts can be fetched:
WHERE receipts.store_id = pos_devices.store_id
  AND receipts.status IN ('LOCKED', 'CONSUMED')
  AND receipt_events.source = 'mobile'  -- Mobile locked it first
```

### One-Time Usage Prevention
```sql
-- Receipt can only be consumed once:
WHERE receipts.status = 'LOCKED'
UPDATE receipts SET status = 'CONSUMED', consumed_at = now()
```

### Bridge App Authentication
```sql
-- Only registered Bridge apps can fetch:
WHERE pos_devices.api_key = @api_key
  AND pos_devices.status = 'ACTIVE'
```

---

## 🧮 Tax Calculation Example

### For Indian GST Compliance
```javascript
// In receipt_items:
hsn_code: '1905'              // Bread category
tax_rate: 5                   // GST rate
unit_price: 100
quantity: 2
line_total: 200
tax_amount: (200 * 5) / 100 = 10

// In receipts:
subtotal: 200
tax_amount: 10
total_amount: 210
```

---

## 📈 Future Enhancements

### Phase 2 (Next)
- [ ] Implement Receipt Fetch API with security rules
- [ ] Build Bridge app to consume receipts
- [ ] Add GST bill generation

### Phase 3
- [ ] Implement sync_logs for inventory management
- [ ] Add multi-POS system drivers (Tally, GoFrugal, etc)
- [ ] Build product sync agent

### Phase 4
- [ ] Add loyalty program integration
- [ ] Implement customer analytics
- [ ] Build admin dashboard

---

## ⚠️ Important Notes

1. **Run in Order**: Migrations have foreign key dependencies - run in the exact order specified
2. **Backup First**: Always backup your production database before migrations
3. **Test First**: Test on staging database first
4. **No Downtime**: These migrations don't require downtime
5. **Idempotent**: All migrations use `IF NOT EXISTS` - safe to run multiple times

---

## 🆘 Troubleshooting

### Error: Foreign Key Constraint
**Cause**: Running migrations out of order
**Solution**: Run migrations in the exact order specified above

### Error: Unique Constraint Violation
**Cause**: Duplicate data in your old tables
**Solution**: Check for duplicates in old `orders` table before migration

### Error: Table Already Exists
**Cause**: Migrations already applied
**Solution**: Safe to ignore - idempotent migrations

---

## 📞 Support
For issues or questions, create an issue in GitHub with:
- Migration file that failed
- Exact error message
- Database type (Supabase PostgreSQL)
- Steps to reproduce
