// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://swtmdczamqahhudphgek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dG1kY3phbXFhaGh1ZHBoZ2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODExMDUsImV4cCI6MjA3NDM1NzEwNX0.-lyZV5W8Af0ynhkXJ9-pC-T0sEosOQh4l-TfDgXbYxM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
