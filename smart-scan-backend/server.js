const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { supabase } = require('./supabaseClient');

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