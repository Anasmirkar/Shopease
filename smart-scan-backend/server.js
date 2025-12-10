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

// Save shopping history
app.post('/save-shopping-history', async (req, res) => {
  try {
    const { userId, receiptNumber, date, time, storeName, products, totalWeight, totalAmount, paymentMethod } = req.body;
    if (!userId || !receiptNumber || !products || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const { error } = await supabase
      .from('shopping_history')
      .insert([{ user_id: userId, receipt_number: receiptNumber, date, time, store_name: storeName, products, total_weight: totalWeight, total_amount: totalAmount, payment_method: paymentMethod }]);
    if (error) return res.status(500).json({ message: 'DB error', error: error.message });
    res.json({ message: 'Shopping history saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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

    // Create order record
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        store_id: storeId,
        status: 'pending',
        total_amount: totalAmount
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ message: 'DB error creating order', error: orderError.message, details: orderError });
    }

    // Use order ID as barcode (format: last 12 chars of UUID, numeric for barcode)
    const barcodeNumber = orderData.id.replace(/-/g, '').substring(0, 12);

    // Get store details for order
    const { data: storeData } = await supabase
      .from('stores')
      .select('name, gst_number')
      .eq('id', storeId)
      .single();

    // Insert order items with complete product details for POS
    const orderItems = products.map(product => {
      // Calculate GST (default 18% if not specified)
      const gstRate = product.gst_rate || 18;
      const linePrice = parseFloat(product.price) * (product.quantity || 1);
      const taxAmount = (linePrice * gstRate) / 100;

      return {
        order_id: orderData.id,
        product_id: product.product_id || null,
        
        // Product details
        product_name: product.name,
        product_hsn_code: product.hsn_code || null,
        product_sku: product.barcode,
        
        // Quantity
        quantity: product.quantity || 1,
        unit_of_measurement: product.unit || 'pcs',
        
        // Pricing
        unit_price: product.price,
        line_total: linePrice,
        
        // Tax
        gst_rate: gstRate,
        tax_amount: taxAmount,
        
        // POS tracking
        pos_sync_status: 'pending'
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      return res.status(500).json({ message: 'DB error saving items', error: itemsError.message });
    }

    // Update order with enhanced details
    const totalTax = orderItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        store_name: storeData?.name,
        store_gst_number: storeData?.gst_number,
        subtotal: products.reduce((sum, p) => sum + (parseFloat(p.price) * (p.quantity || 1)), 0),
        tax_amount: totalTax,
        status: 'confirmed'
      })
      .eq('id', orderData.id);

    if (updateError) {
      console.error('Order update error:', updateError);
    }

    // Generate 1D barcode (CODE128) as PNG
    let barcodeImage;
    try {
      barcodeImage = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeNumber,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
      });
      // Convert to base64
      var barcodeDataUrl = 'data:image/png;base64,' + barcodeImage.toString('base64');
    } catch (err) {
      console.log('Barcode generation error:', err);
      // Fallback if barcode generation fails
      barcodeDataUrl = null;
    }

    res.json({
      message: 'Checkout successful',
      barcodeId: orderData.id,
      barcodeNumber: barcodeNumber,
      barcode: barcodeDataUrl,
      orderId: orderData.id,
      products: products,
      totalAmount: totalAmount
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

    // Fetch order with its items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, products(barcode, name, price)')
      .eq('order_id', orderId);

    if (itemsError) {
      return res.status(500).json({ message: 'Error fetching order items', error: itemsError.message });
    }

    // Format products for POS system
    const formattedProducts = orderItems.map(item => ({
      barcode: item.products?.barcode || 'N/A',
      name: item.products?.name || 'Unknown',
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    res.json({
      orderId: order.id,
      products: formattedProducts,
      totalAmount: order.total_amount,
      paymentStatus: order.status,
      timestamp: order.created_at,
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
    const { data: history, error } = await supabase
      .from('shopping_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return res.status(500).json({ message: 'DB error', error: error.message });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});