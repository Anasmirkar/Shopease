# 🔧 Database Schema Update - Remaining Fixes Required

**Current Status:** 60% Complete | Last Updated: December 15, 2025

---

## Critical Issues Found ⚠️

### Issue #1: Bridge App Still Uses Old 'orders' Table
**File:** `Bridge/src/services/supabaseService.js`  
**Severity:** 🔴 CRITICAL  
**Impact:** Bridge app cannot work with new schema

**Current Code (WRONG):**
```javascript
// Lines 28, 56 - STILL USING OLD TABLE
let { data, error } = await supabase
  .from('orders')  // ❌ OLD TABLE - DOESN'T EXIST IN NEW SCHEMA
  .select(`
    *,
    order_items (  // ❌ OLD TABLE - DOESN'T EXIST IN NEW SCHEMA
      product_name,
      product_sku,
      product_hsn_code,
      quantity,
      unit_of_measurement,
      unit_price,
      line_total,
      gst_rate,
      tax_amount
    )
  `)
  .eq('id', searchId)
  .single();
```

**What It Should Be:**
```javascript
// Option 1: Use New Receipt API (RECOMMENDED)
let { data: receipt, error } = await fetch(
  `${API_URL}/api/receipt/${searchId}`,
  { headers: { 'api_key': apiKey } }
).then(r => r.json());

// Option 2: Query New Tables Directly
let { data, error } = await supabase
  .from('receipts')  // ✅ NEW TABLE
  .select(`
    *,
    receipt_items (  // ✅ NEW TABLE
      product_name,
      barcode as product_sku,
      hsn_code as product_hsn_code,
      quantity,
      unit as unit_of_measurement,
      unit_price,
      line_total,
      tax_rate as gst_rate,
      tax_amount
    )
  `)
  .eq('receipt_code', searchId)  // ✅ Use receipt_code not id
  .single();
```

**Lines to Check:**
- Line 28: `from('orders')` → change to `from('receipts')`
- Line 56: `from('orders')` → change to `from('receipts')`
- Line 56: `order_items` → change to `receipt_items`

---

### Issue #2: Bridge App References Non-Existent 'bridge_transactions' Table
**File:** `Bridge/src/services/supabaseService.js`  
**Severity:** 🟡 IMPORTANT  
**Location:** Line 132  
**Impact:** Transaction logging fails

**Current Code (WRONG):**
```javascript
// Lines 130-135 - REFERENCES TABLE THAT DOESN'T EXIST
const { error } = await supabase
  .from('bridge_transactions')  // ❌ NOT IN NEW SCHEMA
  .insert([{
    order_id: orderId,
    status: status,
    details: details,
    created_at: new Date().toISOString()
  }]);
```

**What It Should Be:**
```javascript
// Use sync_logs from new schema (CORRECT)
const { error } = await supabase
  .from('sync_logs')  // ✅ NEW TABLE
  .insert([{
    entity_id: orderId,
    entity_type: 'receipt',
    sync_type: 'RECEIPT',
    source_system: 'bridge_app',
    status: status,
    details: details ? JSON.stringify(details) : null
  }]);
```

---

### Issue #3: Backend Still Uses Old 'orders' Table in POST /checkout
**File:** `smart-scan-backend/server.js`  
**Severity:** 🔴 CRITICAL  
**Location:** Lines 76-230  
**Impact:** Checkout endpoint creates data in old schema

**Current Code (WRONG):**
```javascript
// Lines 113-120
const { data: orderData, error: orderError } = await supabase
  .from('orders')  // ❌ OLD TABLE
  .insert([{
    user_id: userId,
    store_id: storeId,
    status: 'pending',
    total_amount: totalAmount
  }])
  .select()
  .single();

// Lines 172-173
const { error: itemsError } = await supabase
  .from('order_items')  // ❌ OLD TABLE
  .insert(orderItems);
```

**What It Should Be:**
```javascript
// Use new Receipt API structure
const { data: receipt, error: receiptError } = await supabase
  .from('receipts')  // ✅ NEW TABLE
  .insert([{
    store_id: storeId,
    user_id: userId || null,
    guest_session_id: guestSessionId || null,
    status: 'OPEN',
    receipt_code: uuidv4().replace(/-/g, '').substring(0, 12),
    subtotal: subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount
  }])
  .select()
  .single();

// Insert items using new table
const { error: itemsError } = await supabase
  .from('receipt_items')  // ✅ NEW TABLE
  .insert(receiptItems);
```

---

### Issue #4: Backend POST /save-shopping-history References Old Table
**File:** `smart-scan-backend/server.js`  
**Severity:** 🟡 IMPORTANT  
**Location:** Lines 63-75  
**Impact:** Shopping history feature broken

**Current Code (WRONG):**
```javascript
// Lines 71-72 - USES TABLE THAT DOESN'T EXIST IN NEW SCHEMA
const { error } = await supabase
  .from('shopping_history')  // ❌ OLD TABLE - NOT IN NEW SCHEMA
  .insert([{ 
    user_id: userId, 
    receipt_number: receiptNumber, 
    // ... more fields
  }]);
```

**What It Should Be:**
```javascript
// Option 1: DEPRECATE THIS ENDPOINT (RECOMMENDED)
// Shopping history is now tracked in receipts + receipt_events
app.post('/save-shopping-history', async (req, res) => {
  return res.status(410).json({ 
    message: 'Deprecated - Use new Receipt API instead',
    redirect: 'POST /api/receipt'
  });
});

// Option 2: Use new schema if keeping feature
const { error } = await supabase
  .from('receipt_events')  // ✅ Use events for history
  .insert([{
    receipt_id: receiptId,
    event_type: 'CREATED',
    source: 'mobile_app',
    description: `Receipt #${receiptNumber}`,
    metadata: {
      user_id: userId,
      receipt_number: receiptNumber,
      date: date,
      time: time
    }
  }]);
```

---

### Issue #5: Backend GET /shopping-history/:userId References Old Table
**File:** `smart-scan-backend/server.js`  
**Severity:** 🟡 IMPORTANT  
**Location:** Lines 304-305  
**Impact:** User shopping history lookup broken

**Current Code (WRONG):**
```javascript
// Lines 304-305
const { data: history } = await supabase
  .from('shopping_history')  // ❌ OLD TABLE
  .select('*')
  .eq('user_id', userId);
```

**What It Should Be:**
```javascript
// Use new schema - get all receipts for user
const { data: receipts } = await supabase
  .from('receipts')  // ✅ NEW TABLE
  .select(`
    *,
    receipt_items (*),
    receipt_events (*)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Transform to match expected format
const history = receipts?.map(r => ({
  id: r.id,
  receipt_number: r.receipt_number,
  date: r.created_at,
  total_amount: r.total_amount,
  items: r.receipt_items,
  status: r.status
})) || [];
```

---

### Issue #6: Backend GET /pos/checkout/:orderId Uses Old Tables
**File:** `smart-scan-backend/server.js`  
**Severity:** 🟡 IMPORTANT  
**Location:** Lines 254-266  
**Impact:** POS sync endpoint broken

**Current Code (WRONG):**
```javascript
// Lines 254-266
const { data: order } = await supabase
  .from('orders')  // ❌ OLD TABLE
  .select('*')
  .eq('id', orderId)
  .single();

const { data: orderItems } = await supabase
  .from('order_items')  // ❌ OLD TABLE
  .select('*, products(barcode, name, price)')
  .eq('order_id', orderId);
```

**What It Should Be:**
```javascript
// Use new Receipt API instead
app.get('/pos/checkout/:receiptCode', async (req, res) => {
  try {
    // Forward to new Receipt API
    const receiptRes = await supabase
      .from('receipts')  // ✅ NEW TABLE
      .select(`
        *,
        receipt_items (*)
      `)
      .eq('receipt_code', receiptCode)
      .single();

    if (!receiptRes.data) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const receipt = receiptRes.data;
    
    res.json({
      id: receipt.id,
      receipt_code: receipt.receipt_code,
      items: receipt.receipt_items.map(item => ({
        barcode: item.barcode,
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.line_total
      })),
      totalAmount: receipt.total_amount,
      status: receipt.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
```

---

## Summary of All Remaining Issues

| Priority | File | Issue | Table | Fix |
|----------|------|-------|-------|-----|
| 🔴 CRITICAL | `Bridge/src/services/supabaseService.js` | Lines 28, 56 | `orders` → `receipts` | Update query |
| 🔴 CRITICAL | `Bridge/src/services/supabaseService.js` | Line 56 | `order_items` → `receipt_items` | Update query |
| 🔴 CRITICAL | `smart-scan-backend/server.js` | Lines 113-120 | `orders` → `receipts` | Update POST /checkout |
| 🔴 CRITICAL | `smart-scan-backend/server.js` | Lines 172-173 | `order_items` → `receipt_items` | Update POST /checkout |
| 🟡 IMPORTANT | `Bridge/src/services/supabaseService.js` | Line 132 | `bridge_transactions` → `sync_logs` | Update logging |
| 🟡 IMPORTANT | `smart-scan-backend/server.js` | Lines 63-75 | `shopping_history` → `receipt_events` | Deprecate or migrate |
| 🟡 IMPORTANT | `smart-scan-backend/server.js` | Lines 304-305 | `shopping_history` → `receipts` | Update query |
| 🟡 IMPORTANT | `smart-scan-backend/server.js` | Lines 254-266 | `orders`, `order_items` → `receipts`, `receipt_items` | Update endpoint |

---

## What's Already Fixed ✅

```javascript
// ALREADY WORKING WITH NEW SCHEMA
✅ Screens/LoginScreen.js - guest_sessions with dynamic store lookup
✅ Screens/SignupScreen.js - guest_sessions with dynamic store lookup
✅ src/config/supabase.js - Table constants updated
✅ src/services/authService.js - guestLogin() uses dynamic store_id
✅ smart-scan-backend/server.js - New Receipt API endpoints:
   - POST /api/receipt
   - GET /api/receipt/:receipt_code
   - PUT /api/receipt/:receipt_id/lock
   - PUT /api/receipt/:receipt_code/consume
   - GET /api/receipt/:id/events
   - POST /api/pos-device/register
```

---

## Recommended Fix Order

1. **First:** Update Bridge app (supabaseService.js) - 15 minutes
2. **Second:** Update backend POST /checkout - 20 minutes
3. **Third:** Update backend shopping history endpoints - 10 minutes
4. **Fourth:** Execute SQL migration in Supabase - 5 minutes
5. **Fifth:** Test all endpoints - 30 minutes
6. **Sixth:** Build and test mobile APK - 20 minutes

**Total Time Estimate:** 1.5 - 2 hours to production-ready state

---

## Verification After Fixes

Run these checks to verify everything is working:

```sql
-- Verify new schema exists
SELECT count(*) FROM receipts;
SELECT count(*) FROM receipt_items;
SELECT count(*) FROM receipt_events;
SELECT count(*) FROM guest_sessions;
SELECT count(*) FROM pos_devices;

-- Verify no data in old tables (should be 0 or empty)
SELECT count(*) FROM orders WHERE created_at > now() - interval '1 hour';
SELECT count(*) FROM order_items WHERE created_at > now() - interval '1 hour';
```

```bash
# Test new API endpoints
curl -X POST http://localhost:3000/api/receipt \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "550e8400-e29b-41d4-a716-446655440010",
    "items": [{"barcode": "8901234567890", "product_name": "Rice", "quantity": 1, "unit_price": 399.99, "tax_rate": 5}]
  }'

curl http://localhost:3000/api/receipt/550e8400-e29b
```

---

**Report Generated:** December 15, 2025  
**Files Needing Changes:** 2 critical files  
**Estimated Fix Time:** 1.5 - 2 hours  
**Status:** Ready for immediate implementation

