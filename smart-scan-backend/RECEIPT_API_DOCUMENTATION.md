# ShopEase Receipt API Documentation
## POS Bridge Integration Endpoints

### Base URL
```
http://localhost:3000/api
https://shopease-backend-yvf4.onrender.com/api
```

---

## 📝 Endpoints Overview

| Method | Endpoint | Purpose | Called By |
|--------|----------|---------|-----------|
| POST | `/receipt` | Create new receipt/checkout | Mobile App |
| GET | `/receipt/:receipt_code` | Fetch receipt for POS | Bridge App |
| PUT | `/receipt/:receipt_id/lock` | Lock receipt (generate barcode) | Mobile App |
| PUT | `/receipt/:receipt_code/consume` | Mark as consumed (synced to POS) | Bridge App |
| GET | `/receipt/:receipt_id/events` | Get audit trail | Admin/Bridge |
| POST | `/pos-device/register` | Register Bridge PC app | Bridge App |

---

## 🔧 Detailed Endpoint Reference

### 1. CREATE RECEIPT
**Endpoint**: `POST /api/receipt`  
**Called By**: Mobile App (at checkout)

#### Request
```json
{
  "store_id": "uuid",
  "guest_session_id": "uuid",  // optional if user_id provided
  "user_id": "uuid",           // optional if guest
  "items": [
    {
      "barcode": "8901234567890",
      "product_name": "Rice 1kg",
      "quantity": 2,
      "unit": "pcs",
      "unit_price": 100.50,
      "tax_rate": 5,
      "hsn_code": "1001"
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "message": "Receipt created successfully",
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "receipt_code": "550e8400e29b41d4",
    "status": "OPEN",
    "total_amount": 211.05,
    "items_count": 1
  }
}
```

#### Notes
- Receipt starts in `OPEN` state (customer can modify)
- `receipt_code` is encoded in barcode
- Items are immutable once created
- Automatically calculates tax based on `tax_rate`

---

### 2. GET RECEIPT
**Endpoint**: `GET /api/receipt/:receipt_code`  
**Called By**: Bridge App (at POS counter)

#### Request
```bash
GET /api/receipt/550e8400e29b41d4
Headers:
  Authorization: Bearer {api_key}  # optional - for device tracking
```

#### Response (200 OK)
```json
{
  "success": true,
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "receipt_code": "550e8400e29b41d4",
    "status": "LOCKED",
    "created_at": "2025-12-15T10:30:00Z",
    "subtotal": 201.00,
    "tax_amount": 10.05,
    "total_amount": 211.05
  },
  "store": {
    "name": "Store Name",
    "gst_number": "18AABCT0001K1Z0",
    "pos_type": "tally"
  },
  "items": [
    {
      "barcode": "8901234567890",
      "product_name": "Rice 1kg",
      "quantity": 2,
      "unit": "pcs",
      "unit_price": 100.50,
      "line_total": 201.00,
      "tax_rate": 5,
      "tax_amount": 10.05,
      "hsn_code": "1001"
    }
  ]
}
```

#### Error Responses
```json
// Not found
{
  "message": "Receipt not found"
}

// Invalid state
{
  "message": "Receipt cannot be scanned in OPEN state"
}

// Unauthorized
{
  "message": "Unauthorized device"
}
```

---

### 3. LOCK RECEIPT
**Endpoint**: `PUT /api/receipt/:receipt_id/lock`  
**Called By**: Mobile App (when customer hits "Checkout")

#### Request
```bash
PUT /api/receipt/550e8400-e29b-41d4-a716-446655440000/lock
Body: {}
```

#### Response (200 OK)
```json
{
  "message": "Receipt locked successfully",
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "receipt_code": "550e8400e29b41d4",
    "status": "LOCKED"
  }
}
```

#### State Transition
```
OPEN → LOCKED
      ↓
   (barcode generated on mobile)
```

---

### 4. CONSUME RECEIPT
**Endpoint**: `PUT /api/receipt/:receipt_code/consume`  
**Called By**: Bridge App (after syncing to POS)

#### Request
```bash
PUT /api/receipt/550e8400e29b41d4/consume
Headers:
  Authorization: Bearer {api_key}
Body:
{
  "pos_response": "Success - Bill #1234 generated"  // optional metadata
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Receipt consumed successfully",
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "receipt_code": "550e8400e29b41d4",
    "status": "CONSUMED",
    "consumed_at": "2025-12-15T10:31:45Z"
  }
}
```

#### State Transition
```
LOCKED → CONSUMED
   ↓
(items synced to POS)
```

#### Prevents Double Billing
- Only `LOCKED` receipts can be consumed
- Once consumed, Bridge cannot fetch it again
- Prevents accidental duplicate entries in POS

---

### 5. GET RECEIPT EVENTS (Audit Trail)
**Endpoint**: `GET /api/receipt/:receipt_id/events`  
**Called By**: Admin Dashboard, Support

#### Request
```bash
GET /api/receipt/550e8400-e29b-41d4-a716-446655440000/events
```

#### Response (200 OK)
```json
{
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "events": [
    {
      "event_type": "CREATED",
      "source": "mobile",
      "created_at": "2025-12-15T10:30:00Z",
      "description": "Receipt created by customer"
    },
    {
      "event_type": "LOCKED",
      "source": "mobile",
      "created_at": "2025-12-15T10:30:45Z",
      "description": "Barcode generated - ready for scanning"
    },
    {
      "event_type": "SCANNED",
      "source": "bridge",
      "created_at": "2025-12-15T10:31:00Z",
      "description": "Barcode scanned at counter"
    },
    {
      "event_type": "CONSUMED",
      "source": "bridge",
      "created_at": "2025-12-15T10:31:45Z",
      "description": "Items synced to POS - Bill #1234"
    }
  ]
}
```

#### Event Types
- `CREATED`: Receipt initialized
- `LOCKED`: Barcode generated (ready for POS)
- `SCANNED`: Barcode scanned at counter
- `CONSUMED`: Items synced to POS
- `EXPIRED`: Receipt expired (not used within time limit)

---

### 6. REGISTER POS DEVICE
**Endpoint**: `POST /api/pos-device/register`  
**Called By**: Bridge App (on first launch)

#### Request
```json
{
  "store_id": "uuid-of-store",
  "device_name": "Counter-1",
  "device_id": "CPU-ID-or-MAC-ADDRESS"
}
```

#### Response (201 Created)
```json
{
  "message": "Device registered successfully",
  "device": {
    "id": "device-uuid",
    "api_key": "550e8400-e29b-41d4-a716-446655440000",
    "device_name": "Counter-1",
    "registered_at": "2025-12-15T10:00:00Z"
  }
}
```

#### Important
- Save `api_key` locally in Bridge app (encrypted)
- Use `api_key` in Authorization header for all Bridge requests
- One `api_key` per device for tracking and security

---

## 🔐 Security Rules

### Receipt Fetch Authorization
```
✓ Only Bridge apps with valid api_key can fetch receipts
✓ Bridge app can only fetch receipts from its store
✓ Receipt must be in LOCKED or CONSUMED state
```

### One-Time Consumption
```
✓ Only LOCKED receipts can be consumed
✓ After consumption, status changes to CONSUMED
✓ Cannot consume the same receipt twice
```

### Device Registration
```
✓ device_id must be unique per device (hardware fingerprint)
✓ Prevents Bridge app cloning/spoofing
✓ api_key is the authentication token
```

---

## 📊 Receipt Lifecycle

```
Customer Journey:
┌─────────────────────────────────────────────────────┐
│ 1. Mobile: Scan products → CREATE RECEIPT (OPEN)    │
│ 2. Mobile: Tap "Checkout" → LOCK RECEIPT            │
│ 3. Mobile: Show barcode to customer                 │
│ 4. Customer: Go to counter                          │
│ 5. Counter: Scan barcode with Bridge app            │
│ 6. Bridge: GET RECEIPT → Fetch items                │
│ 7. Bridge: Paste items to POS system                │
│ 8. Bridge: CONSUME RECEIPT → Mark done              │
│ 9. POS: Generate GST-compliant bill                 │
└─────────────────────────────────────────────────────┘

State Diagram:
OPEN
  ↓ (when customer ready)
LOCKED
  ↓ (when scanned at counter)
CONSUMED
  ↓ (if expired)
EXPIRED
```

---

## 🧮 Tax Calculation

### Automatic GST Calculation
```javascript
// For each item:
tax_amount = (unit_price * quantity * tax_rate) / 100

// For receipt:
receipt.tax_amount = sum of all item tax_amounts
receipt.total_amount = subtotal + tax_amount - discount
```

### HSN Code Reference (India)
```
1001 = Cereals (Rice, Wheat)       → GST: 0%
1905 = Bread & Bakery              → GST: 5%
2201 = Mineral Water                → GST: 5%
2206 = Alcoholic Beverages         → GST: 18%
```

---

## 🚀 Integration Examples

### Mobile App (React Native)
```javascript
// Create receipt at checkout
const response = await fetch('https://api.example.com/api/receipt', {
  method: 'POST',
  body: JSON.stringify({
    store_id: selectedStore.id,
    guest_session_id: sessionId,
    items: scannedProducts
  })
});

// Lock receipt and generate barcode
await fetch(`https://api.example.com/api/receipt/${receiptId}/lock`, {
  method: 'PUT'
});
```

### Bridge App (Electron)
```javascript
// Register device on first launch
const registerResponse = await fetch('https://api.example.com/api/pos-device/register', {
  method: 'POST',
  body: JSON.stringify({
    store_id: storeId,
    device_name: 'Counter-1',
    device_id: getHardwareId()
  })
});
const apiKey = registerResponse.device.api_key;

// Fetch receipt when barcode scanned
const receiptResponse = await fetch(
  `https://api.example.com/api/receipt/${scannedCode}`,
  { headers: { 'Authorization': apiKey } }
);

// Paste items to notepad/POS
pasteToClipboard(formatItems(receiptResponse.items));

// Mark as consumed
await fetch(
  `https://api.example.com/api/receipt/${scannedCode}/consume`,
  { 
    method: 'PUT',
    headers: { 'Authorization': apiKey }
  }
);
```

---

## ⚠️ Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Missing required fields | Check request body |
| 401 | Unauthorized device | Register device first |
| 404 | Receipt not found | Check receipt_code |
| 400 | Receipt cannot be scanned in X state | Receipt not locked yet |
| 500 | DB error | Check server logs |

---

## 📞 Support
For API issues:
1. Check receipt_events for audit trail
2. Verify store_id and device_id
3. Check server logs for errors
4. Create GitHub issue with error code and timestamp
