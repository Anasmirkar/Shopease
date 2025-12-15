const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { supabase } = require('./supabaseClient');
const { v4: uuidv4 } = require('uuid');
const bwipjs = require('bwip-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Smart Scan Backend API is running!' });
});

// Remove all mongoose schemas and OTP logic

// Register user (no OTP, just create user)
app.post('/register', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone required' });
    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    if (existingUser) return res.status(400).json({ message: 'User already registered' });
    // Insert user
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, phone }])
      .select()
      .single();
    if (error) return res.status(500).json({ message: 'DB error', error: error.message });
    res.json({ message: 'Registration successful', user: data });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone required' });
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    if (!user) return res.status(400).json({ message: 'User not registered' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save shopping history - DEPRECATED
// Use new Receipt API instead (POST /api/receipt)
app.post('/save-shopping-history', async (req, res) => {
  return res.status(410).json({ 
    message: 'Deprecated endpoint - Use new Receipt API: POST /api/receipt',
    redirect: '/api/receipt',
    info: 'Shopping history is now tracked in receipts table'
  });
});

// Checkout endpoint - Generate barcode and save checkout data
app.post('/checkout', async (req, res) => {
  try {
    const { userId, storeId, products, totalAmount } = req.body;
    
    if (!userId || !storeId || !products || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields: userId, storeId, products, totalAmount' });
    }

    // First, check if user exists, if not create a placeholder user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      // Create a placeholder user for this checkout
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          phone_number: 'unknown',
          name: 'Guest User'
        }]);
      
      if (userError && userError.code !== '23505') { // 23505 = unique violation (user already exists)
        console.error('User creation error:', userError);
      }
    }

    // Create receipt record using new schema
    const receipt_code = uuidv4().replace(/-/g, '').substring(0, 12);
    
    // Calculate totals
    const totals = products.reduce((acc, product) => {
      const gstRate = product.gst_rate || 18;
      const linePrice = parseFloat(product.price) * (product.quantity || 1);
      const taxAmount = (linePrice * gstRate) / 100;
      return {
        subtotal: acc.subtotal + linePrice,
        tax_amount: acc.tax_amount + taxAmount,
        total_amount: acc.total_amount + linePrice + taxAmount
      };
    }, { subtotal: 0, tax_amount: 0, total_amount: 0 });

    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert([{
        store_id: storeId,
        user_id: userId,
        status: 'OPEN',
        receipt_code: receipt_code,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount
      }])
      .select()
      .single();

    if (receiptError) {
      console.error('Receipt creation error:', receiptError);
      return res.status(500).json({ message: 'DB error creating receipt', error: receiptError.message });
    }

    // Insert receipt items using new schema
    const receiptItems = products.map(product => {
      const gstRate = product.gst_rate || 18;
      const linePrice = parseFloat(product.price) * (product.quantity || 1);
      const taxAmount = (linePrice * gstRate) / 100;

      return {
        receipt_id: receipt.id,
        barcode: product.barcode,
        product_name: product.name,
        quantity: product.quantity || 1,
        unit: product.unit || 'pcs',
        unit_price: product.price,
        line_total: linePrice,
        tax_rate: gstRate,
        tax_amount: taxAmount,
        hsn_code: product.hsn_code || null
      };
    });

    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(receiptItems);

    if (itemsError) {
      console.error('Receipt items error:', itemsError);
      return res.status(500).json({ message: 'DB error saving items', error: itemsError.message });
    }

    // Log CREATED event
    await supabase
      .from('receipt_events')
      .insert([{
        receipt_id: receipt.id,
        event_type: 'CREATED',
        source: 'mobile_app'
      }]);

    res.json({
      message: 'Checkout successful',
      barcodeId: receipt.id,
      barcodeNumber: receipt_code,
      barcode: null,
      receiptId: receipt.id,
      receiptCode: receipt.receipt_code,
      products: products,
      totalAmount: totals.total_amount
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POS endpoint - Fetch checkout details by order ID (barcode)
app.get('/pos/checkout/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch receipt using new schema
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select(`
        *,
        receipt_items (*)
      `)
      .eq('receipt_code', orderId)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Format products for POS system
    const formattedProducts = receipt.receipt_items.map(item => ({
      barcode: item.barcode,
      name: item.product_name,
      quantity: item.quantity,
      price: item.unit_price,
      total: item.line_total
    }));

    res.json({
      receiptId: receipt.id,
      receiptCode: receipt.receipt_code,
      products: formattedProducts,
      totalAmount: receipt.total_amount,
      paymentStatus: receipt.status,
      timestamp: receipt.created_at,
      // String format for direct keyboard emulation
      keyboardEmulationText: formattedProducts
        .map(p => `${p.barcode}|${p.name}|${p.quantity}|${p.price}`)
        .join('\n')
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user shopping history
app.get('/shopping-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch user's receipts from new schema
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select(`
        id,
        receipt_number,
        receipt_code,
        status,
        subtotal,
        tax_amount,
        total_amount,
        created_at,
        receipt_items (
          barcode,
          product_name,
          quantity,
          unit,
          unit_price,
          line_total,
          tax_rate,
          tax_amount
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) return res.status(500).json({ message: 'DB error', error: error.message });
    
    // Transform receipts to match old shopping_history format for compatibility
    const history = receipts?.map(receipt => ({
      id: receipt.id,
      receiptNumber: receipt.receipt_number,
      receiptCode: receipt.receipt_code,
      date: receipt.created_at,
      status: receipt.status,
      items: receipt.receipt_items,
      subtotal: receipt.subtotal,
      taxAmount: receipt.tax_amount,
      totalAmount: receipt.total_amount,
      itemsCount: receipt.receipt_items?.length || 0
    })) || [];
    
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================================
// RECEIPT API ENDPOINTS (POS Bridge Integration)
// ========================================

// 1. CREATE RECEIPT (Called by mobile app at checkout)
app.post('/api/receipt', async (req, res) => {
  try {
    const { store_id, guest_session_id, user_id, items } = req.body;

    if (!store_id || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: store_id, items' });
    }

    // Generate unique receipt code (for barcode encoding)
    const receipt_code = uuidv4().replace(/-/g, '').substring(0, 12);

    // Calculate totals
    const totals = items.reduce((acc, item) => {
      const line_total = (item.unit_price * item.quantity);
      const tax_amount = (line_total * (item.tax_rate || 0)) / 100;
      return {
        subtotal: acc.subtotal + line_total,
        tax_amount: acc.tax_amount + tax_amount,
        total_amount: acc.total_amount + line_total + tax_amount
      };
    }, { subtotal: 0, tax_amount: 0, total_amount: 0 });

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert([{
        store_id,
        user_id: user_id || null,
        guest_session_id: guest_session_id || null,
        status: 'OPEN',
        receipt_code,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount
      }])
      .select()
      .single();

    if (receiptError) {
      console.error('Receipt creation error:', receiptError);
      return res.status(500).json({ message: 'Failed to create receipt', error: receiptError.message });
    }

    // Insert receipt items
    const receipt_items = items.map(item => ({
      receipt_id: receipt.id,
      barcode: item.barcode,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      unit_price: item.unit_price,
      line_total: item.unit_price * item.quantity,
      tax_rate: item.tax_rate || 0,
      tax_amount: (item.unit_price * item.quantity * (item.tax_rate || 0)) / 100,
      hsn_code: item.hsn_code || null
    }));

    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(receipt_items);

    if (itemsError) {
      console.error('Receipt items error:', itemsError);
      return res.status(500).json({ message: 'Failed to save items', error: itemsError.message });
    }

    // Log CREATED event
    await supabase
      .from('receipt_events')
      .insert([{
        receipt_id: receipt.id,
        event_type: 'CREATED',
        source: 'mobile'
      }]);

    res.status(201).json({
      message: 'Receipt created successfully',
      receipt: {
        id: receipt.id,
        receipt_code: receipt.receipt_code,
        status: receipt.status,
        total_amount: receipt.total_amount,
        items_count: items.length
      }
    });

  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. GET RECEIPT (Called by Bridge app to fetch order details)
app.get('/api/receipt/:receipt_code', async (req, res) => {
  try {
    const { receipt_code } = req.params;
    const { api_key } = req.headers;

    if (!receipt_code) {
      return res.status(400).json({ message: 'receipt_code required' });
    }

    // Verify Bridge app authentication (if api_key provided)
    if (api_key) {
      const { data: device } = await supabase
        .from('pos_devices')
        .select('*')
        .eq('api_key', api_key)
        .eq('status', 'ACTIVE')
        .single();

      if (!device) {
        return res.status(401).json({ message: 'Unauthorized device' });
      }
    }

    // Fetch receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('receipt_code', receipt_code)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Check if receipt is in correct state for scanning
    if (!['LOCKED', 'CONSUMED'].includes(receipt.status)) {
      return res.status(400).json({ message: `Receipt cannot be scanned in ${receipt.status} state` });
    }

    // Fetch receipt items
    const { data: items, error: itemsError } = await supabase
      .from('receipt_items')
      .select('*')
      .eq('receipt_id', receipt.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return res.status(500).json({ message: 'Failed to fetch items', error: itemsError.message });
    }

    // Fetch store details
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('id', receipt.store_id)
      .single();

    // Format response for POS Bridge app
    res.json({
      success: true,
      receipt: {
        id: receipt.id,
        receipt_code: receipt.receipt_code,
        status: receipt.status,
        created_at: receipt.created_at,
        subtotal: receipt.subtotal,
        tax_amount: receipt.tax_amount,
        total_amount: receipt.total_amount
      },
      store: store ? {
        name: store.name,
        gst_number: store.gst_number,
        pos_type: store.pos_type
      } : null,
      items: items.map(item => ({
        barcode: item.barcode,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        line_total: item.line_total,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        hsn_code: item.hsn_code
      }))
    });

  } catch (error) {
    console.error('Fetch receipt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 3. LOCK RECEIPT (Called by mobile app when generating barcode)
app.put('/api/receipt/:receipt_id/lock', async (req, res) => {
  try {
    const { receipt_id } = req.params;

    if (!receipt_id) {
      return res.status(400).json({ message: 'receipt_id required' });
    }

    // Update receipt status to LOCKED
    const { data: receipt, error: updateError } = await supabase
      .from('receipts')
      .update({
        status: 'LOCKED',
        locked_at: new Date().toISOString()
      })
      .eq('id', receipt_id)
      .select()
      .single();

    if (updateError || !receipt) {
      return res.status(500).json({ message: 'Failed to lock receipt', error: updateError?.message });
    }

    // Log LOCKED event
    await supabase
      .from('receipt_events')
      .insert([{
        receipt_id: receipt.id,
        event_type: 'LOCKED',
        source: 'mobile'
      }]);

    res.json({
      message: 'Receipt locked successfully',
      receipt: {
        id: receipt.id,
        receipt_code: receipt.receipt_code,
        status: receipt.status
      }
    });

  } catch (error) {
    console.error('Lock receipt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 4. CONSUME RECEIPT (Called by Bridge app after syncing to POS)
app.put('/api/receipt/:receipt_code/consume', async (req, res) => {
  try {
    const { receipt_code } = req.params;
    const { api_key } = req.headers;

    if (!receipt_code) {
      return res.status(400).json({ message: 'receipt_code required' });
    }

    // Verify Bridge app
    if (api_key) {
      const { data: device } = await supabase
        .from('pos_devices')
        .select('*')
        .eq('api_key', api_key)
        .eq('status', 'ACTIVE')
        .single();

      if (!device) {
        return res.status(401).json({ message: 'Unauthorized device' });
      }
    }

    // Fetch receipt first
    const { data: receipt } = await supabase
      .from('receipts')
      .select('*')
      .eq('receipt_code', receipt_code)
      .single();

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Only LOCKED receipts can be consumed
    if (receipt.status !== 'LOCKED') {
      return res.status(400).json({ message: `Cannot consume receipt in ${receipt.status} state` });
    }

    // Update status to CONSUMED
    const { data: updated, error: updateError } = await supabase
      .from('receipts')
      .update({
        status: 'CONSUMED',
        consumed_at: new Date().toISOString()
      })
      .eq('id', receipt.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Failed to consume receipt', error: updateError.message });
    }

    // Log CONSUMED event
    await supabase
      .from('receipt_events')
      .insert([{
        receipt_id: receipt.id,
        event_type: 'CONSUMED',
        source: 'bridge'
      }]);

    res.json({
      success: true,
      message: 'Receipt consumed successfully',
      receipt: {
        id: updated.id,
        receipt_code: updated.receipt_code,
        status: updated.status,
        consumed_at: updated.consumed_at
      }
    });

  } catch (error) {
    console.error('Consume receipt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 5. GET RECEIPT EVENTS (Audit trail)
app.get('/api/receipt/:receipt_id/events', async (req, res) => {
  try {
    const { receipt_id } = req.params;

    if (!receipt_id) {
      return res.status(400).json({ message: 'receipt_id required' });
    }

    const { data: events, error } = await supabase
      .from('receipt_events')
      .select('*')
      .eq('receipt_id', receipt_id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch events', error: error.message });
    }

    res.json({
      receipt_id,
      events: events.map(event => ({
        event_type: event.event_type,
        source: event.source,
        created_at: event.created_at,
        description: event.description,
        metadata: event.metadata
      }))
    });

  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 6. REGISTER POS DEVICE (Called by Bridge app on first launch)
app.post('/api/pos-device/register', async (req, res) => {
  try {
    const { store_id, device_name, device_id } = req.body;

    if (!store_id || !device_name || !device_id) {
      return res.status(400).json({ message: 'Missing required fields: store_id, device_name, device_id' });
    }

    // Generate API key
    const api_key = uuidv4();

    // Register device
    const { data: device, error } = await supabase
      .from('pos_devices')
      .insert([{
        store_id,
        device_name,
        device_id,
        api_key,
        status: 'ACTIVE'
      }])
      .select()
      .single();

    if (error) {
      console.error('Device registration error:', error);
      return res.status(500).json({ message: 'Failed to register device', error: error.message });
    }

    res.status(201).json({
      message: 'Device registered successfully',
      device: {
        id: device.id,
        api_key: device.api_key,
        device_name: device.device_name,
        registered_at: device.registered_at
      }
    });

  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});