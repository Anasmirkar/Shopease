// supabaseClient.js for backend
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://swtmdczamqahhudphgek.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dG1kY3phbXFhaGh1ZHBoZ2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODExMDUsImV4cCI6MjA3NDM1NzEwNX0.-lyZV5W8Af0ynhkXJ9-pC-T0sEosOQh4l-TfDgXbYxM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = { supabase };