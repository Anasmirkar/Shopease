// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://liqjhpzcdzljzxiyzecu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BXiSMgJHwuXGswOZVYnB2A_0lkf2A4_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
