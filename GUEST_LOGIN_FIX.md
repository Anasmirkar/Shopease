# 🔧 Guest Login Fix - Table Schema Update

## Problem
Mobile app was looking for old `guests` table which doesn't exist in new schema.

**Error:** `could not find the table "public.guests" in the scheme cache`

## Solution
Updated mobile app to use new `guest_sessions` table from the professional POS schema.

## Files Updated

### 1. **Screens/LoginScreen.js** ✅
- Changed: `guests` → `guest_sessions`
- Added required: `store_id` parameter (uses test store UUID)

### 2. **Screens/SignupScreen.js** ✅
- Changed: `guests` → `guest_sessions`
- Added required: `store_id` parameter

### 3. **src/config/supabase.js** ✅
- Updated TABLES config:
  - `GUESTS: 'guests'` → `GUESTS: 'guest_sessions'`
- Added new table references:
  - RECEIPT_ITEMS
  - RECEIPT_EVENTS
  - POS_DEVICES
  - SYNC_LOGS
  - TRANSACTIONS

### 4. **src/services/authService.js** ✅
- Updated guestLogin() method
- Changed: `guests` → `guest_sessions`
- Added: `store_id` parameter in insert

## What Changed in Schema

### Old Table (guests)
```sql
- device_id
- created_at
```

### New Table (guest_sessions)
```sql
- id (UUID)
- device_id (TEXT)
- store_id (UUID) ← REQUIRED NEW FIELD
- session_token (TEXT)
- started_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Test Store UUID Used
`f47ac10b-58cc-4372-a567-0e02b2c3d479` (placeholder)

**Note:** In production, you'll need to dynamically get the actual store_id from the user's selected store.

## Next Steps

1. ✅ Schema migration executed in Supabase
2. ✅ Mobile app updated to use new table
3. ⏳ Test guest login again
4. ⏳ Build new APK with these fixes
5. ⏳ Deploy to Render

## Testing

**To test guest login:**
1. Build new APK with these changes
2. Run migration SQL in Supabase
3. Try guest login on mobile
4. Should create entry in `guest_sessions` table

---

**Status:** Fixed and pushed to GitHub ✅
**Branch:** database-enhancement-pos-bridge
