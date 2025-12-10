# Database Migrations - ShopEase POS Bridge

## Overview
These migrations enhance the ShopEase database to support the POS Bridge (Electron PC app) integration. They add fields to store complete product details and GST information for quick POS entry.

## Migration Files

### 001_enhance_orders_for_pos.sql
Enhances `orders` and `order_items` tables with POS-required fields.

**Changes to `order_items`:**
- `product_name` - Full product name for POS display
- `product_hsn_code` - HSN code for GST lookup
- `product_sku` - Product barcode/SKU
- `unit_of_measurement` - Unit (pcs, kg, ltr, etc.)
- `gst_rate` - GST percentage (default 18%)
- `tax_amount` - Calculated tax amount
- `unit_price` - Price per unit
- `line_total` - Total price for this line
- `pos_item_code` - POS system's internal item code
- `pos_sync_status` - Sync status with POS ('pending', 'synced', 'failed')

**Changes to `orders`:**
- `store_name` - Store name for billing
- `store_gst_number` - Store's GST registration number
- `subtotal` - Total before tax
- `tax_amount` - Total tax amount
- `discount_amount` - Total discount (if any)
- `barcode_scanned_at` - When counter staff scanned the barcode
- `scanned_by_counter_staff` - Counter staff identifier
- `pos_synced` - Whether POS has processed this order
- `pos_sync_timestamp` - When POS processed it
- `pos_transaction_id` - POS system's transaction ID

**New Indexes Created:**
- `idx_orders_barcode_number` - Fast barcode lookup
- `idx_orders_status` - Filter by status
- `idx_order_items_pos_sync_status` - Bridge app queries

## How to Apply Migrations

### Method 1: Supabase SQL Editor (Recommended)
1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy the entire SQL from `001_enhance_orders_for_pos.sql`
5. Click **Run** to execute

### Method 2: Using migration runner (Future)
```bash
cd smart-scan-backend
node run-migrations.js
```

## Data Changes Required

### Update Products Table
Ensure your products table has GST information:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS (
  hsn_code VARCHAR(20),
  gst_rate DECIMAL(5,2) DEFAULT 18
);
```

### Update Stores Table
Ensure stores have GST details:

```sql
ALTER TABLE stores ADD COLUMN IF NOT EXISTS (
  gst_number VARCHAR(50),
  address VARCHAR(500),
  phone VARCHAR(20)
);
```

## Backend Changes

The `POST /checkout` endpoint has been updated to:
1. Fetch store details (name, GST number)
2. Calculate tax for each item based on GST rate
3. Store complete product details in order_items
4. Update order with subtotal and tax information
5. Set initial `pos_sync_status` to 'pending'

This ensures the Bridge PC app has all information needed for fast POS entry.

## Bridge App Integration

The Bridge PC app will:
1. Query orders with `pos_sync_status = 'pending'`
2. Extract all order_items data
3. Format data for target POS system
4. Send to POS system via API or keyboard emulation
5. Update `pos_synced = true` and `pos_sync_status = 'synced'`

## Testing

After applying migrations:

```bash
# 1. Test checkout endpoint
curl -X POST http://localhost:3001/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "storeId": "store-001",
    "products": [
      {
        "name": "Product 1",
        "product_id": "prod-123",
        "barcode": "1234567890",
        "quantity": 2,
        "price": 100,
        "gst_rate": 18,
        "hsn_code": "1234"
      }
    ],
    "totalAmount": 236
  }'

# 2. Check order_items in Supabase
SELECT * FROM order_items WHERE pos_sync_status = 'pending';
```

## Troubleshooting

### Migration failed in Supabase
- Check if columns already exist
- Ensure all table names are correct
- Verify Supabase user has necessary permissions

### Checkout endpoint error
- Verify stores table has gst_number column
- Check products have gst_rate or use default 18%
- Ensure userId and storeId exist in database

## Rollback (if needed)

To revert migrations:

```sql
-- Remove added columns
ALTER TABLE order_items DROP COLUMN IF EXISTS product_name;
ALTER TABLE order_items DROP COLUMN IF EXISTS product_hsn_code;
-- ... repeat for all added columns

ALTER TABLE orders DROP COLUMN IF EXISTS store_name;
ALTER TABLE orders DROP COLUMN IF EXISTS store_gst_number;
-- ... repeat for all added columns

-- Drop indexes
DROP INDEX IF EXISTS idx_orders_barcode_number;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_order_items_pos_sync_status;
```

## Next Steps

1. ✅ Apply database migrations
2. ✅ Update checkout endpoint (already done)
3. 📋 Create Bridge PC app API endpoints
4. 📋 Build Electron POS Bridge application
5. 📋 Implement POS integrations (Ghassal, DSPPOS, etc.)
6. 📋 Add GST bill generation

---

For questions or issues, check the main README.md or contact the development team.
