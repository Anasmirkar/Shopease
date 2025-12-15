# 🚀 Fresh Database Setup Guide

## ✅ What's Been Created

Your new professional POS database schema is **complete and ready to deploy**!

### Files Available:
- **`001_create_complete_new_schema_with_migration.sql`** - Complete schema + dummy test data

### What This Script Does:
1. **Creates 10 production-ready tables**
   - users (with auth support)
   - stores (with POS config)
   - products (with HSN codes for GST)
   - receipts (source of truth with lifecycle)
   - receipt_items (immutable snapshots)
   - receipt_events (audit trail)
   - guest_sessions (frictionless checkout)
   - pos_devices (Bridge app registry)
   - transactions (payment records)
   - sync_logs (for future sync agent)

2. **Inserts realistic test data**
   - 3 Test Users with loyalty points
   - 2 Stores (Mumbai, Bangalore)
   - 6 Products with Indian GST codes (HSN)
   - 3 Receipts in different states (OPEN, LOCKED, CONSUMED)
   - 6 Receipt items with proper tax calculations
   - Complete audit trail with events
   - 2 POS devices (Bridge apps)
   - Sample transactions

## 📋 Setup Instructions

### Step 1: Execute in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire contents of `001_create_complete_new_schema_with_migration.sql`
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for all queries to complete ✅

### Step 2: Verify Data
The script includes verification queries. You should see:
```
✅ DUMMY DATA LOADED
- total_users: 3
- total_stores: 2
- total_products: 6
- total_receipts: 3
- total_receipt_items: 6
- total_receipt_events: 6
- total_transactions: 2
- total_pos_devices: 2
- total_guest_sessions: 2
- total_sync_logs: 2
```

## 🧪 Test Data Reference

### Test Receipt Codes (for API testing):
| Receipt Code | Status | Use Case |
|---|---|---|
| `550e8400-e29b` | LOCKED | Test barcode scanning at counter |
| `550e8400-e29b-41d4-a716-446655440031` | OPEN | Test editing before checkout |
| `550e8400-e29b-41d4-a716-446655440032` | CONSUMED | Test one-time consumption prevention |

### Test Stores:
- **Store 1**: Mumbai Main Store (Tally POS)
- **Store 2**: Bangalore Branch (GoFrugal POS)

### Test Users:
- Rajesh Kumar (9876543210) - 500 loyalty points
- Priya Singh (9876543211) - 250 loyalty points
- Amit Patel (9876543212) - 0 loyalty points

### Test Products:
- Basmati Rice 5kg (₹399.99) - HSN 1001, 5% GST
- Refined Oil 1L (₹129.99) - HSN 1514, 5% GST
- Coffee Powder 500g (₹249.99) - HSN 2109, 18% GST
- Chocolate Bar (₹49.99) - HSN 1704, 18% GST
- Milk 500ml (₹39.99) - HSN 0403, 5% GST
- Bread Pack (₹59.99) - HSN 1905, 5% GST

## 🔌 API Endpoints Ready to Test

Once backend is deployed to Render, test these endpoints:

### 1. Create Receipt (Mobile App)
```bash
POST /api/receipt
Content-Type: application/json

{
  "store_id": "550e8400-e29b-41d4-a716-446655440010",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "items": [
    {"barcode": "8901234567890", "quantity": 2},
    {"barcode": "8901234567892", "quantity": 1}
  ]
}
```

### 2. Fetch Receipt (Bridge App)
```bash
GET /api/receipt/550e8400-e29b
X-API-Key: sk_test_51234567890abcdef_111111111111111111111111
```

### 3. Lock Receipt (Generate Barcode)
```bash
PUT /api/receipt/550e8400-e29b-41d4-a716-446655440030/lock
```

### 4. Consume Receipt (Mark Synced to POS)
```bash
PUT /api/receipt/550e8400-e29b-41d4-a716-446655440030/consume
```

### 5. Get Audit Trail
```bash
GET /api/receipt/550e8400-e29b-41d4-a716-446655440030/events
```

## 📊 Database Features

### Receipt Lifecycle (Prevents Double Billing)
```
OPEN (customer editing)
  ↓
LOCKED (barcode generated, ready for counter)
  ↓
CONSUMED (items synced to POS, ONE-TIME ONLY - cannot revert)
  ↓
EXPIRED (timeout)
```

### Tax Calculation (India GST Ready)
- Subtotal = sum of (quantity × unit_price)
- Tax Amount = subtotal × tax_rate
- Total = subtotal + tax_amount

Example for ₹100 item at 18% GST:
- Subtotal: ₹100.00
- Tax: ₹18.00
- Total: ₹118.00

### Immutable Receipt Items
- Even if product price changes, receipt_items snapshot remains unchanged
- Historical accuracy guaranteed
- Tax rates stored at item level for compliance

### Audit Trail (receipt_events)
Every transaction change logged with:
- Event type (CREATED, LOCKED, SCANNED, CONSUMED, EXPIRED)
- Source (mobile_app, bridge_app, manual)
- Timestamp
- Metadata (JSON)

## 🚀 Next Steps

### 1. Deploy Backend
```bash
# Push to main branch (Render auto-deploys)
git checkout main
git merge database-enhancement-pos-bridge
git push origin main
```

### 2. Test API Endpoints
```bash
# Test with dummy data
curl https://shopease-backend-yvf4.onrender.com/api/receipt/550e8400-e29b
```

### 3. Build Bridge App (Electron)
- Fetch receipt from API using receipt_code
- Display items for verification
- Send consume request to mark as synced
- Integration with Tally/GoFrugal/Custom POS

### 4. Update Mobile App
- Change checkout endpoint to POST /api/receipt
- Implement receipt code display as barcode
- Add receipt tracking

### 5. Test End-to-End Flow
1. Mobile app creates receipt
2. Customer gets barcode
3. Counter scans barcode with Bridge app
4. Items appear in POS system
5. Bill auto-generates

## 🔐 Security Built-in

✅ **One-time consumption prevention** - Receipt can only transition LOCKED → CONSUMED once
✅ **API key authentication** - Bridge devices authenticated
✅ **Store isolation** - Device can only access its store
✅ **Audit trail** - Complete history for compliance
✅ **Immutable items** - Historical accuracy guaranteed

## 📝 Notes

- All UUIDs are deterministic for testing (you can recreate)
- Test API keys are generated (should be replaced in production)
- Dummy data includes realistic Indian GST codes (HSN)
- Receipt codes use first 12 chars of UUID for barcode compatibility
- Ready for production immediately (just change API keys and GST numbers)

## 💡 Tips

- Use receipt code `550e8400-e29b` to test Bridge app scanning
- Try consuming same receipt twice - should fail (one-time only)
- Check receipt_events to see complete audit trail
- Products have HSN codes - use for GST bill generation
- Stores configured with POS system types (extensible)

---

**Status**: ✅ Ready for deployment  
**Last Updated**: December 15, 2025  
**Next Milestone**: Deploy to Render + Build Bridge App
