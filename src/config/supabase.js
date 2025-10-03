/**
 * Supabase Configuration
 * Centralized Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';
import { AppConstants } from '../constants';

// Supabase configuration
const SUPABASE_URL = 'https://your-project.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // Replace with your key

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
  SHOPPING_HISTORY: 'shopping_history',
  RECEIPTS: 'receipts',
};

export default supabase;