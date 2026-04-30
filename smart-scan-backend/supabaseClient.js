// supabaseClient.js for backend
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://liqjhpzcdzljzxiyzecu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcWpocHpjZHpsanp4aXl6ZWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODkyMTcsImV4cCI6MjA5Mjk2NTIxN30.YvgP-aX-elHIH2oXSwtc3SWIvmsSBoI-RE27P8it3x4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = { supabase };