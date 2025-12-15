# 🏪 ShopEase Bridge - POS Integration Tool

Professional Electron desktop application for fetching ShopEase orders and integrating them with POS systems using keyboard emulation.

## Features

✅ **Order Fetching**
- Input order ID or barcode number
- Fetch complete order details from Supabase
- Display products, quantities, and GST information

✅ **POS Integration**
- Auto-paste order items to any active window (Notepad, POS system)
- Keyboard emulation for reliable input
- Configurable keyboard delay for different POS systems

✅ **Professional UI**
- Dark theme optimized for counter environments
- Real-time order preview
- Transaction history and logging

✅ **Configuration**
- Supabase credentials management
- Keyboard delay tuning
- Auto-paste toggle

✅ **System Tray Integration**
- Minimize to system tray
- Quick access from taskbar

## Installation

### Prerequisites
- Node.js 14+ and npm
- Supabase account with ShopEase database
- Windows 7+ (or macOS/Linux with Electron)

### Setup

1. **Clone and install dependencies:**
```bash
cd Bridge
npm install
```

2. **Configure Supabase credentials:**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and API key
   - Or configure in the app Settings tab

3. **Run in development:**
```bash
npm start
```

## Building for Distribution

### Windows Installer (.exe)
```bash
npm run build:exe
```

This creates:
- `ShopEase Bridge Setup.exe` - Installer with MSI
- `ShopEase Bridge.exe` - Portable version

### Portable Build
```bash
npm run build:win
```

## Usage

### Fetching Orders

1. **Open the app** and go to "Fetch Orders" tab
2. **Enter Order ID or Barcode Number**
   - Full UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
   - Partial barcode (e.g., `550e8400e29b`)
3. **Click "Fetch Order Details"**
4. **Review the order preview** showing:
   - Product names and quantities
   - Unit prices and GST rates
   - Subtotal, tax, and grand total

### Pasting to POS

1. **Open your POS software** (or any text editor like Notepad)
2. **Position cursor** where you want to enter order items
3. **Click "Paste to POS"** button in Bridge app
4. Items will be automatically typed into the active window

### Configuration

Go to Settings tab to configure:

| Setting | Description |
|---------|------------|
| **Supabase URL** | Your Supabase project URL |
| **Supabase API Key** | Your Supabase API key |
| **Keyboard Delay** | Milliseconds between keystrokes (10-1000ms) |
| **Auto-paste Enabled** | Auto-paste after fetching order |

### Keyboard Delay Tuning

Different POS systems have different input speeds:
- **Fast POS** (30-50ms): Modern systems, cloud-based
- **Standard POS** (50-100ms): Most retail systems
- **Legacy POS** (100-200ms): Older systems, slow input processing

Increase delay if items are missing or duplicated.

## Database Schema

### Required Tables

The app expects these tables in Supabase:

**orders**
```sql
- id (UUID, primary key)
- user_id (UUID)
- store_id (UUID)
- store_name (VARCHAR)
- store_gst_number (VARCHAR)
- status (VARCHAR)
- subtotal (DECIMAL)
- tax_amount (DECIMAL)
- total_amount (DECIMAL)
- items_snapshot (JSONB) -- Array of order items
- created_at (TIMESTAMP)
```

**order_items** (optional, used as fallback)
```sql
- id (UUID, primary key)
- order_id (UUID, foreign key)
- product_name (VARCHAR)
- product_sku (VARCHAR)
- product_hsn_code (VARCHAR)
- quantity (INTEGER)
- unit_price (DECIMAL)
- gst_rate (DECIMAL)
- tax_amount (DECIMAL)
```

## File Structure

```
Bridge/
├── main.js                 # Electron main process
├── preload.js              # Context isolation bridge
├── index.html              # UI interface
├── package.json            # Dependencies and build config
├── .env.example            # Environment variables template
│
└── src/
    └── services/
        ├── supabaseService.js    # Supabase client & queries
        ├── keyboardService.js    # Keyboard emulation
        └── configService.js      # Configuration management
```

## Troubleshooting

### Issue: "Order not found"
- Verify order ID/barcode is correct
- Check Supabase credentials in Settings
- Ensure order exists in database

### Issue: Text not pasting to POS
- Increase keyboard delay in Settings
- Ensure POS window is active/focused before pasting
- Some POS systems may require additional configuration

### Issue: Missing items in pasted order
- Order may not have `items_snapshot` in database
- Backend checkout endpoint needs to populate this field
- Check ShopEase backend server.js checkout endpoint

### Issue: Supabase connection fails
- Verify URL and API key are correct
- Check internet connection
- Ensure Supabase project is active
- Verify RLS policies allow read access to orders table

## Database Migration

If upgrading from existing ShopEase, run this SQL in Supabase:

```sql
-- Add items_snapshot column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_snapshot JSONB;

-- Backfill items_snapshot from order_items
UPDATE orders SET items_snapshot = (
  SELECT jsonb_agg(jsonb_build_object(
    'product_name', product_name,
    'product_sku', product_sku,
    'quantity', quantity,
    'unit_price', unit_price,
    'gst_rate', gst_rate,
    'tax_amount', tax_amount
  ))
  FROM order_items
  WHERE order_items.order_id = orders.id
);
```

## POS Integration Examples

### Notepad Test
1. Open Notepad
2. Enter order ID in Bridge app
3. Click "Paste to POS"
4. Items should appear in Notepad

### Real POS Systems
- **Pos.Ghassal**: Set keyboard delay to 75-100ms
- **DSPPOS**: Set keyboard delay to 50-75ms
- **Custom POS**: Test with various delays until reliable

## Advanced Features

### Import Custom Order Format
Modify `displayOrderPreview()` in `index.html` to change output format.

### Custom Keyboard Emulation
Edit `src/services/keyboardService.js` to implement alternative input methods (e.g., API calls to POS).

### Database Logging
Uncomment `logTransaction()` calls in `src/services/supabaseService.js` to track all orders fetched.

## Security Notes

⚠️ **Important:**
- Store Supabase API key securely
- Use restricted API keys (read-only to orders table)
- Don't share credentials
- Config file stored in `%USERPROFILE%/.shopease-bridge/` (local to user)

## Support & Development

### Dependencies
- **electron**: Desktop application framework
- **@supabase/supabase-js**: Supabase client
- **robotjs**: Keyboard/mouse automation
- **electron-builder**: Application packaging

### Contributing
To extend the app:

1. Add new services in `src/services/`
2. Expose via IPC handlers in `main.js`
3. Update `preload.js` context bridge
4. Add UI in `index.html`

### Rebuilding
After changes:
```bash
npm start          # Test locally
npm run build:exe  # Package for distribution
```

## License

MIT - ShopEase Bridge

## Roadmap

- [ ] Support for multiple POS systems
- [ ] Network printing to POS devices
- [ ] Barcode scanner integration
- [ ] Order analytics dashboard
- [ ] Real-time order notifications
- [ ] Multi-store support
- [ ] GST compliance reports

---

**ShopEase Bridge v1.0.0** - Professional POS Integration Tool
