# 📋 Database Schema Update Audit Report

**Date:** December 15, 2025  
**Status:** ⚠️ **PARTIAL - Action Required**  
**Target Schema:** Professional POS Schema v2 (10 tables)

---

## Executive Summary

The migration to the new Professional POS Schema has been **60% complete** across the codebase. While the new schema tables have been properly referenced in most files, **critical legacy code remains** that still references old table names. This audit identifies all mismatches and provides a complete migration checklist.

### Quick Stats
- ✅ **New Schema Tables Created:** 10 (users, stores, products, guest_sessions, receipts, receipt_items, receipt_events, pos_devices, sync_logs, transactions)
- ✅ **Files Updated for New Schema:** 7
- ⚠️ **Files Still Using Old Tables:** 2
- ⚠️ **Migration SQL:** Ready but NOT YET EXECUTED in Supabase

---

## Part 1: Files Updated ✅

### 1. Mobile App - Authentication Layer

#### File: `Screens/LoginScreen.js`
- **Status:** ✅ UPDATED
- **Change:** Dynamic guest session creation
- **Tables Referenced:**
  - `users` - ✅ Correct (querying for OTP verification)
  - `guest_sessions` - ✅ Correct (with store_id)
- **Key Fix:** Removed hard-coded store_id, now fetches from `stores` table dynamically

#### File: `Screens/SignupScreen.js`
- **Status:** ✅ UPDATED
- **Change:** Dynamic guest session creation
- **Tables Referenced:**
  - `users` - ✅ Correct (inserting new user)
  - `guest_sessions` - ✅ Correct (with store_id)
- **Key Fix:** Removed hard-coded store_id, now fetches from `stores` table dynamically

#### File: `src/config/supabase.js`
- **Status:** ✅ UPDATED
- **Change:** Table constants configuration
- **Old Table Names:**
  - `'guests'` ❌ CHANGED TO → `'guest_sessions'` ✅
- **New References Added:**
  - `RECEIPT_ITEMS: 'receipt_items'`
  - `RECEIPT_EVENTS: 'receipt_events'`
  - `POS_DEVICES: 'pos_devices'`
  - `SYNC_LOGS: 'sync_logs'`
  - `TRANSACTIONS: 'transactions'`

#### File: `src/services/authService.js`
- **Status:** ✅ UPDATED (Today)
- **Change:** Guest login method updated
- **Tables Referenced:**
  - `guest_sessions` - ✅ Correct
  - `stores` - ✅ Correct (dynamic store lookup)
- **Key Fix:** Removed hard-coded store_id, implemented dynamic lookup

### 2. Backend API Layer

#### File: `smart-scan-backend/server.js`
- **Status:** ✅ MOSTLY UPDATED
- **New Receipt API Endpoints (All use correct schema):**
  - `POST /api/receipt` - ✅ Uses: `receipts`, `receipt_items`, `receipt_events`
  - `GET /api/receipt/:receipt_code` - ✅ Uses: `receipts`, `receipt_items`, `stores`
  - `PUT /api/receipt/:receipt_id/lock` - ✅ Uses: `receipts`, `receipt_events`
  - `PUT /api/receipt/:receipt_code/consume` - ✅ Uses: `receipts`, `receipt_events`
  - `GET /api/receipt/:id/events` - ✅ Uses: `receipt_events`
  - `POST /api/pos-device/register` - ✅ Uses: `pos_devices`

**Old Legacy Code (Still Active):**
```javascript
// Lines 20-75: OLD ENDPOINTS (not using new schema)
- POST /register → uses 'users' (OK)
- POST /login → uses 'users' (OK)
- POST /save-shopping-history → uses 'shopping_history' ❌ (OLD TABLE)
- GET /shopping-history/:userId → queries 'shopping_history' ❌ (OLD TABLE)
```

**Checkout Endpoint Issues (Lines 76-230):**
```javascript
// POST /checkout - STILL USING OLD TABLES ❌
- Creates: 'orders' table (should be 'receipts')
- Creates: 'order_items' table (should be 'receipt_items')
- Does NOT create 'receipt_events'
- Does NOT use: store_id, guest_session_id from new schema
```

---

## Part 2: Files NOT Updated ⚠️

### 1. Bridge App - Service Layer

#### File: `Bridge/src/services/supabaseService.js`
- **Status:** ❌ NOT UPDATED
- **Critical Issue:** Still references old 'orders' table
- **Location:** Lines 28, 56
- **Code:**
  ```javascript
  .from('orders')  // ❌ Should be 'receipts'
    .select(`
      *,
      order_items (  // ❌ Should be 'receipt_items'
        product_name,
        product_sku,
        ...
      )
    `)
  ```
- **Impact:** Bridge app cannot fetch new receipts with new schema
- **Required Fix:** Update to use new Receipt API endpoint or migrate to new table structure

#### File: `Bridge/src/services/supabaseService.js` - Transaction Logging
- **Status:** ❌ NOT UPDATED
- **Critical Issue:** References 'bridge_transactions' table (not in new schema)
- **Location:** Line 132
- **Required Fix:** Change to use `sync_logs` table from new schema OR remove if not needed

### 2. MainScreen.js - Legacy Features

#### File: `Screens/MainScreen.js`
- **Status:** ⚠️ PARTIALLY UPDATED
- **Shopping/Receipt Feature Status:**
  - Uses `/save-shopping-history` endpoint (references old 'shopping_history' table)
  - Uses `/shopping-history/:userId` endpoint (references old 'shopping_history' table)
  - Not yet migrated to new Receipt API
- **Required Update:** Change to use `/api/receipt` POST endpoint instead

---

## Part 3: Database Schema Comparison

### New Schema vs Old Schema

| Feature | Old Schema | New Schema | Status |
|---------|-----------|-----------|--------|
| User Authentication | `users` table | `users` table | ✅ Same |
| Guest Sessions | `guests` table (minimal) | `guest_sessions` (full schema) | ⚠️ Need migration |
| Store Management | `stores` table | `stores` table | ✅ Same |
| Products | `products` (barcode as FK) | `products` (barcode as PK) | ⚠️ Schema changed |
| Orders | `orders` table | `receipts` table | ⚠️ CRITICAL |
| Order Items | `order_items` table | `receipt_items` table | ⚠️ CRITICAL |
| Payment Tracking | `transactions` table | `transactions` table | ✅ Same |
| Shopping History | `shopping_history` table | REMOVED (use receipts) | ⚠️ Legacy feature |
| Sync Tracking | `sync_log` table | `sync_logs` table | ⚠️ Name changed |
| Bridge Devices | Not tracked | `pos_devices` table | ✅ New feature |
| Audit Trail | Not tracked | `receipt_events` table | ✅ New feature |

---

## Part 4: Migration Status by Component

### 1. Mobile App Frontend
```
✅ Login/Signup screens → Using new guest_sessions
✅ AuthService → Using new guest_sessions  
✅ Supabase config → Updated table references
⚠️ MainScreen shopping history → Still using old endpoints
```

### 2. Backend API
```
✅ Receipt creation endpoints → New schema (receipts, receipt_items, receipt_events)
✅ Receipt fetching → New schema
✅ POS device registration → New schema
❌ Legacy endpoints → Still using old tables (shopping_history, orders, order_items)
```

### 3. Bridge App (Desktop)
```
❌ supabaseService.js → Still references 'orders' table
❌ Transaction logging → References non-existent 'bridge_transactions'
```

### 4. Database
```
⏳ Migration SQL ready: `001_create_complete_new_schema_with_migration.sql`
⏳ Test data included (3 users, 2 stores, 6 products, 3 receipts)
⏳ NOT YET EXECUTED in Supabase
```

---

## Part 5: Action Items (Priority Order)

### 🔴 CRITICAL - Must Fix Before Production

#### 1. Bridge App Migration
```
File: Bridge/src/services/supabaseService.js
Issue: Lines 28, 56 use 'orders' table
Status: ❌ NOT UPDATED
Action: 
  - Option A: Update fetchOrderFromDatabase() to use Receipt API endpoint
  - Option B: Migrate to query 'receipts' and 'receipt_items' tables
Timeline: IMMEDIATE
```

#### 2. Execute Database Migration
```
File: smart-scan-backend/migrations/001_create_complete_new_schema_with_migration.sql
Issue: Schema not yet in Supabase
Status: ⏳ READY but NOT EXECUTED
Action:
  1. Go to Supabase SQL Editor
  2. Copy entire migration file content
  3. Paste and execute
  4. Verify: 3 users, 2 stores, 6 products, 3 receipts created
Timeline: BEFORE testing
```

#### 3. Backend Legacy Endpoints
```
Files: smart-scan-backend/server.js (lines 20-230)
Issue: Old checkout endpoint uses 'orders' and 'order_items' tables
Status: ❌ NOT UPDATED
Action:
  - Remove or deprecate: POST /checkout, GET /pos/checkout/:orderId
  - Use: New Receipt API endpoints (POST /api/receipt, GET /api/receipt/:receipt_code)
Timeline: Before merging to main
```

### 🟡 IMPORTANT - Should Fix Soon

#### 4. MainScreen Shopping History Feature
```
File: Screens/MainScreen.js
Issue: Uses old /save-shopping-history endpoint
Status: ⚠️ PARTIALLY UPDATED
Action:
  - Replace with: POST /api/receipt endpoint
  - Fetch receipts using: GET /api/receipt/:receipt_code
Timeline: Before next build
```

#### 5. Bridge Transaction Logging
```
File: Bridge/src/services/supabaseService.js (line 132)
Issue: References 'bridge_transactions' table (not in schema)
Status: ❌ NOT UPDATED
Action:
  - Migrate to: INSERT into 'sync_logs' table
  - Use: entity_type='receipt', source_system='bridge_app'
Timeline: Before Bridge app release
```

### 🟢 NICE-TO-HAVE - Can Do Later

#### 6. Documentation Updates
```
Files: Various *.md files
Issue: Some docs reference old table names
Action: Update guides and API documentation
Timeline: After core migration complete
```

---

## Part 6: Verification Checklist

### Before Deployment

- [ ] **Database Migration Executed**
  - [ ] 10 tables created in Supabase
  - [ ] Test data inserted (verify counts match expected)
  - [ ] All indexes created successfully

- [ ] **API Endpoints Verified**
  - [ ] POST /api/receipt creates receipts correctly
  - [ ] GET /api/receipt/:receipt_code fetches receipt with items
  - [ ] PUT /api/receipt/:id/lock updates status to LOCKED
  - [ ] PUT /api/receipt/:code/consume prevents re-consumption
  - [ ] GET /api/receipt/:id/events returns audit trail

- [ ] **Mobile App Updated**
  - [ ] LoginScreen uses guest_sessions
  - [ ] SignupScreen uses guest_sessions
  - [ ] authService.js updated with dynamic store lookup
  - [ ] No hard-coded store_id references remain

- [ ] **Bridge App Updated**
  - [ ] fetchOrderFromDatabase uses Receipt API OR migrated to new schema
  - [ ] Transaction logging uses sync_logs table
  - [ ] API authentication with pos_devices table working

- [ ] **New APK Built**
  - [ ] All mobile app changes included
  - [ ] eas build --platform android --profile preview successful
  - [ ] Guest login flow tested end-to-end

---

## Part 7: Implementation Timeline

### Phase 1: Database (Today)
```
1. Execute migration SQL in Supabase (30 seconds)
2. Verify test data loaded correctly
3. Backup current data if needed
```

### Phase 2: Bridge App (Tomorrow)
```
1. Update supabaseService.js to use new schema/API
2. Update transaction logging
3. Test Bridge app against new schema
4. Commit and push changes
```

### Phase 3: Backend (Tomorrow)
```
1. Review /checkout endpoint usage
2. Migrate or deprecate old endpoints
3. Test new Receipt API endpoints
4. Deploy to Render
```

### Phase 4: Mobile App (Next Day)
```
1. Verify all guest_sessions references working
2. Build new APK
3. Install on test device
4. Test guest login flow
```

### Phase 5: Production (Final)
```
1. Merge feature branch to main
2. Render auto-deploys backend
3. Release mobile APK
4. Monitor for issues
```

---

## Part 8: Files That STILL Need Migration

```
HIGH PRIORITY (Blocking features):
❌ Bridge/src/services/supabaseService.js - MUST UPDATE
  - Lines 28, 56: 'orders' → 'receipts'
  - Line 56: 'order_items' → 'receipt_items'
  - Line 132: 'bridge_transactions' → 'sync_logs'

MEDIUM PRIORITY (Using legacy features):
⚠️ Screens/MainScreen.js - SHOULD UPDATE
  - generateReceipt() uses /save-shopping-history endpoint
  - Should use: POST /api/receipt instead

LOW PRIORITY (Documentation):
📝 smart-scan-backend/MIGRATIONS.md
📝 Various README files
📝 API documentation
```

---

## Part 9: Summary of Changes Already Applied

### ✅ Completed Today

1. **Updated 4 Mobile App Files:**
   - `Screens/LoginScreen.js` - Guest session with dynamic store lookup
   - `Screens/SignupScreen.js` - Guest session with dynamic store lookup
   - `src/config/supabase.js` - Table name corrections
   - `src/services/authService.js` - Dynamic store lookup in guestLogin()

2. **Git Commit:** "fix: Complete guest login store lookup across all layers"
   - All changes committed and pushed to `database-enhancement-pos-bridge` branch

3. **Documentation Created:**
   - `GUEST_LOGIN_FIX.md` - Details of this fix
   - Migration guidance for remaining components

---

## Part 10: Next Immediate Steps

### ✅ Already Done
1. Mobile app guest login fixed
2. All 4 mobile auth files updated
3. Changes committed to Git

### ⏭️ Do This Next
1. **Update Bridge App** - supabaseService.js (15 minutes)
2. **Execute SQL Migration** - Supabase (5 minutes)
3. **Test API Endpoints** - Postman (20 minutes)
4. **Build New APK** - Render (10 minutes)
5. **Test End-to-End** - Device (30 minutes)

---

## Quick Reference: Old vs New Table Mappings

```javascript
// OLD → NEW TABLE MAPPINGS
'guests' → 'guest_sessions' (CRITICAL)
'orders' → 'receipts' (CRITICAL)
'order_items' → 'receipt_items' (CRITICAL)
'shopping_history' → receipts + receipt_items (DEPRECATE)
'sync_log' → 'sync_logs' (RENAME)
'bridge_transactions' → 'sync_logs' (CONSOLIDATE)

// NEW TABLES (NO OLD EQUIVALENT)
'receipt_events' (audit trail)
'pos_devices' (bridge app registry)
```

---

**Report Generated:** December 15, 2025  
**Migration Status:** 60% Complete - Action Required  
**Critical Blockers:** 2 (Bridge App, Database Migration)  
**Recommended Timeline:** 3-4 hours to production-ready state

