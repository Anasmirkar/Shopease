/**
 * Supabase Configuration
 * Centralized Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';
import { AppConstants } from '../constants';

// Supabase configuration
const SUPABASE_URL = 'https://liqjhpzcdzljzxiyzecu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcWpocHpjZHpsanp4aXl6ZWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODkyMTcsImV4cCI6MjA5Mjk2NTIxN30.YvgP-aX-elHIH2oXSwtc3SWIvmsSBoI-RE27P8it3x4';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database table names
export const TABLES = {
  USERS: 'users',
  GUESTS: 'guests',
  STORES: 'stores',
  PRODUCTS: 'products',
  CARTS: 'carts',
  CART_ITEMS: 'cart_items',
  CHECKOUTS: 'checkouts',
  SHOPPING_HISTORY: 'shopping_history',
  RECEIPTS: 'receipts',
};

export default supabase;