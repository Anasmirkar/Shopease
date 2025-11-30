# Checkout & Barcode Integration - Database Schema

## Database Tables Used

Your checkout feature uses the following existing tables from your Supabase schema:

### 1. **orders** table
Stores checkout/order information
- `id` - Order ID (used as barcode ID)
- `user_id` - References customer from users table
- `store_id` - References store from stores table
- `status` - Set to 'pending' at checkout, updated to 'paid' after payment
- `total_amount` - Total purchase amount
- `created_at` - Checkout timestamp

### 2. **order_items** table
Stores individual products in each order
- `id` - Item ID
- `order_id` - References the order
- `product_id` - References product from products table
- `quantity` - How many units of this product
- `price` - Price at time of purchase

### 3. **users** table (referenced)
Customer information
- `id` - User ID
- `phone_number` - Customer phone
- `name` - Customer name

### 4. **stores** table (referenced)
Store information where checkout happens
- `id` - Store ID
- `name` - Store name
- `location` - Store address/coordinates

### 5. **products** table (referenced)
Product catalog
- `id` - Product ID
- `barcode` - Product barcode
- `name` - Product name
- `price` - Product price
- `store_id` - Which store sells this product

## Checkout Flow

```
1. Customer scans products → stored in scannedProducts array
2. Click "Proceed to Checkout" → Select "Counter Payment (Barcode)"
3. POST /checkout endpoint:
   - Creates new ORDER record with status='pending'
   - Creates ORDER_ITEMS records for each scanned product
   - Generates QR code using order.id as barcode
   - Returns order.id as barcodeId
4. Navigate to CheckoutBarcodeScreen
   - Display QR code image
   - Show scanned products from order_items
   - Show total amount from orders.total_amount
5. Customer shows barcode at counter
6. POS scans barcode (which is the order.id)
7. GET /pos/checkout/:orderId
   - Fetches order details from orders table
   - Fetches items from order_items with product info
   - Returns formatted product list for POS keyboard emulation

```

## API Endpoints

### POST /checkout
**Creates a new order with checkout data and generates 1D barcode (CODE128)**

Request:
```json
{
  "userId": "user-uuid",
  "storeId": "store-uuid",
  "products": [
    {
      "barcode": "123456",
      "name": "Product Name",
      "product_id": "product-uuid",
      "quantity": 1,
      "price": 99.99,
      "total": 99.99
    }
  ],
  "totalAmount": 99.99
}
```

Response:
```json
{
  "message": "Checkout successful",
  "barcodeId": "550e8400-e29b",
  "barcodeNumber": "550e8400e29b",
  "barcode": "data:image/png;base64,...",
  "orderId": "550e8400-e29b",
  "products": [...],
  "totalAmount": 99.99
}
```

**Barcode Details:**
- Type: CODE128 (1D barcode, POS-compatible)
- Value: First 12 chars of order UUID (numeric)
- Format: PNG image with text below
- Display: Compatible with traditional POS barcode scanners

### GET /pos/checkout/:orderId
**POS system fetches order details by barcode (order ID)**

Response:
```json
{
  "orderId": "550e8400-e29b",
  "products": [
    {
      "barcode": "123456",
      "name": "Product Name",
      "quantity": 1,
      "price": 99.99,
      "total": 99.99
    }
  ],
  "totalAmount": 99.99,
  "paymentStatus": "pending",
  "timestamp": "2025-11-29T10:30:00Z",
  "keyboardEmulationText": "123456|Product Name|1|99.99\n..."
}
```

## Notes

- Order ID is used as the barcode/QR code value
- Products are fetched from the database with relationships to product table
- Payment status starts as "pending" and can be updated via additional endpoint
- The keyboard emulation text is formatted as: `barcode|name|quantity|price` per line
