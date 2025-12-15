# Schema Migration Guide: Old Orders → New Receipts
## Complete Migration Instructions

---

## 📋 Pre-Migration Checklist

- [ ] **Backup Database** - Create Supabase backup before running migration
- [ ] **Stop Mobile App** - Prevent new orders during migration
- [ ] **Stop Bridge App** - Prevent concurrent access
- [ ] **Test in Staging** - Run migration in staging environment first
- [ ] **Notify Users** - Let customer support know about downtime
- [ ] **Prepare Rollback Plan** - Have rollback SQL ready

---

## 🔄 Migration Steps

### Step 1: Backup Your Database
**Supabase Dashboard:**
1. Go to **Project Settings** → **Backups**
2. Click **Backup Now** or ensure daily backups are enabled
3. Download backup file to local storage

**Timeline:** ~5 minutes

---

### Step 2: Create New Schema (If Not Already Done)
Run these migrations in order (via Supabase SQL Editor):

```
002_new_schema_users.sql
003_new_schema_guest_sessions.sql
004_new_schema_stores.sql
005_new_schema_products.sql
006_new_schema_receipts.sql
007_new_schema_receipt_items.sql
008_new_schema_receipt_events.sql
009_new_schema_pos_devices.sql
010_new_schema_sync_logs.sql
```

**Timeline:** ~2 minutes

---

### Step 3: Run Data Migration
**Via Supabase SQL Editor:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of: `020_migrate_old_to_new_schema.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Wait for completion

**Expected Output:**
```
total_receipts: X
total_items: Y
total_events: Z
total_users: A
total_guest_sessions: B
migration_logs: C
```

**Timeline:** ~30 seconds to 2 minutes (depends on data size)

---

### Step 4: Verify Migration

Run these verification queries in Supabase:

#### Query 1: Check Receipts Count
```sql
SELECT COUNT(*) as receipt_count FROM receipts;
```
Should match your original `orders` count.

#### Query 2: Check Receipt Items Count
```sql
SELECT COUNT(*) as items_count FROM receipt_items;
```
Should match your original `order_items` count.

#### Query 3: Check Receipt Events
```sql
SELECT event_type, COUNT(*) 
FROM receipt_events 
GROUP BY event_type;
```
Should show CREATED, LOCKED, CONSUMED events.

#### Query 4: Check Data Integrity
```sql
SELECT r.id, COUNT(ri.id) as item_count
FROM receipts r
LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
GROUP BY r.id
HAVING COUNT(ri.id) = 0;
```
Should return 0 rows (every receipt has items).

#### Query 5: Check Sample Receipt
```sql
SELECT 
  r.id,
  r.receipt_code,
  r.status,
  r.total_amount,
  COUNT(ri.id) as items_count
FROM receipts r
LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
LIMIT 5
GROUP BY r.id;
```
Visually inspect the data.

---

### Step 5: Test Bridge App

1. **Start Backend Server:**
   ```bash
   cd smart-scan-backend
   npm install
   PORT=3001 node server.js
   ```

2. **Test Receipt Fetch:**
   ```bash
   # Get a receipt_code from database
   SELECT receipt_code FROM receipts LIMIT 1;
   
   # Test API call
   curl -X GET http://localhost:3001/api/receipt/{receipt_code}
   ```

3. **Verify Response:**
   - Should return complete receipt with items
   - Items should have barcode, product_name, quantity, tax info
   - Store details should be included

---

### Step 6: Update Application Code

#### Mobile App (React Native)
Update `MainScreen.js` checkout to use new Receipt API:

```javascript
// OLD:
POST /checkout

// NEW:
POST /api/receipt
PUT /api/receipt/{id}/lock
```

#### Backend Server
Update `server.js` to use:
- `POST /api/receipt` (instead of `/checkout`)
- `PUT /api/receipt/{id}/lock` (instead of barcode generation in checkout)

---

### Step 7: Deploy Updated Backend

1. **Push Code to GitHub:**
   ```bash
   git add -A
   git commit -m "Update to use new receipts schema"
   git push origin main
   ```

2. **Render Auto-Deploy:**
   - Render will auto-deploy on push to main
   - Check deployment status in Render dashboard
   - Wait for "Deployment Successful"

3. **Verify Production:**
   ```bash
   curl https://shopease-backend-yvf4.onrender.com/api/receipt/test-code
   ```
   Should return proper response (even if receipt not found is OK for testing connectivity)

---

### Step 8: Archive Old Tables (Optional but Recommended)

After 1-2 weeks of successful operation, archive old tables:

```sql
-- In Supabase SQL Editor:

-- Rename to archive
ALTER TABLE orders RENAME TO orders_archived;
ALTER TABLE order_items RENAME TO order_items_archived;
ALTER TABLE shopping_history RENAME TO shopping_history_archived;

-- Create views for backward compatibility (if needed)
CREATE OR REPLACE VIEW orders AS
SELECT * FROM orders_archived;

CREATE OR REPLACE VIEW order_items AS
SELECT * FROM order_items_archived;
```

---

## 📊 Data Mapping Reference

### Orders → Receipts Mapping
```
orders.id                  → receipts.id
orders.store_id            → receipts.store_id
orders.user_id             → receipts.user_id
orders.status              → receipts.status (converted)
orders.total_amount        → receipts.total_amount
orders.created_at          → receipts.created_at
orders.locked_at           → receipts.locked_at (or created_at if confirmed)
```

### Order Items → Receipt Items Mapping
```
order_items.id             → receipt_items.id
order_items.order_id       → receipt_items.receipt_id
order_items.barcode        → receipt_items.barcode
order_items.product_name   → receipt_items.product_name
order_items.quantity       → receipt_items.quantity
order_items.unit_price     → receipt_items.unit_price
order_items.tax_amount     → receipt_items.tax_amount
order_items.gst_rate       → receipt_items.tax_rate
```

### Status Conversion
```
orders.status          → receipts.status
NULL/unknown           → 'OPEN'
'pending'              → 'OPEN'
'confirmed'            → 'LOCKED'
'completed'            → 'CONSUMED'
```

---

## ⚠️ Rollback Procedure

If migration fails or something goes wrong:

### Option 1: Quick Rollback (within 24 hours)
```bash
# In Supabase:
1. Go to Backups
2. Click "Restore" on latest backup from before migration
3. Confirm restoration (will take 5-10 minutes)
```

### Option 2: Manual Rollback (if backup failed)
```sql
-- In Supabase SQL Editor:
DELETE FROM sync_logs WHERE sync_type = 'RECEIPT' AND created_at > '2025-12-15'::timestamp;
DELETE FROM receipt_events WHERE created_at > '2025-12-15'::timestamp;
DELETE FROM receipt_items WHERE created_at > '2025-12-15'::timestamp;
DELETE FROM receipts WHERE created_at > '2025-12-15'::timestamp;
DELETE FROM guest_sessions WHERE device_id LIKE 'migrated-%';

-- Revert code changes to use old endpoints
git revert HEAD~1
```

---

## 🆘 Troubleshooting

### Issue: Foreign Key Constraint Error
**Cause:** Running migrations out of order  
**Solution:** Ensure all new schema migrations run before migration script

### Issue: Duplicate receipt_codes
**Cause:** Running migration script twice  
**Solution:** Rollback and restore from backup

### Issue: Missing receipt_items
**Cause:** order_items didn't migrate  
**Solution:** Check if order_items table exists and has data

**Query to debug:**
```sql
SELECT COUNT(*) FROM order_items;
SELECT COUNT(*) FROM receipt_items;
```

### Issue: Users not migrated
**Cause:** user_id in orders doesn't exist in users table  
**Solution:** Script creates placeholder users, this is normal

---

## ✅ Post-Migration Checklist

- [ ] All receipt counts match order counts
- [ ] All receipt_items counts match order_items counts
- [ ] Receipt events show proper state transitions
- [ ] Bridge app can fetch receipts successfully
- [ ] Mobile app checkout creates receipts
- [ ] Production backend deployed successfully
- [ ] Test end-to-end flow: Mobile → Receipt → Bridge → POS
- [ ] Monitor error logs for 24 hours
- [ ] Notify users that new system is live

---

## 📈 Performance Impact

**Before:** Orders + order_items tables  
**After:** Receipts + receipt_items + receipt_events (audit trail)

**Storage increase:** ~15-20% (due to audit events)  
**Query performance:** No change (same indexes)  
**Write performance:** Slightly slower (audit events logged)  
**Read performance:** Same or faster (receipt_events indexed)

---

## 🚀 Timeline Summary

| Step | Duration | Notes |
|------|----------|-------|
| Backup | 5 min | Safety first |
| Create Schema | 2 min | New tables |
| Migrate Data | 1-2 min | Data copy |
| Verify | 5 min | Sanity checks |
| Test Bridge | 10 min | End-to-end |
| Deploy | 5 min | Auto-deploy on Render |
| **Total** | **~30 min** | **Zero downtime** |

---

## 📞 Support

If you encounter issues:

1. **Check Error Message** - Run verification queries
2. **Check Logs** - Look at server.js console output
3. **Check Events** - Query receipt_events for audit trail
4. **Rollback if Needed** - Restore from backup
5. **Create GitHub Issue** - Include error details and timestamps

---

## 🎯 Success Criteria

✅ Migration complete when:
1. Receipts count matches orders count
2. Receipt items count matches order items count
3. Bridge app successfully fetches receipts
4. Mobile app creates receipts with new API
5. No errors in production logs for 24 hours
