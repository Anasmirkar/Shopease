/**
 * Supabase Configuration
 * Centralized Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';
import { AppConstants } from '../constants';

// Supabase configuration
const SUPABASE_URL = 'https://liqjhpzcdzljzxiyzecu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BXiSMgJHwuXGswOZVYnB2A_0lkf2A4_';

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