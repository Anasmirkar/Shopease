const { createClient } = require('@supabase/supabase-js');
const { getConfig } = require('./configService');

let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const config = await getConfig();
  
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Supabase credentials not configured. Please configure in Settings.');
  }

  supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
  return supabaseClient;
}

async function fetchOrderFromDatabase(orderId) {
  try {
    const supabase = await getSupabaseClient();

    // Normalize the input - remove hyphens if present (barcode format)
    let searchId = orderId.trim().toLowerCase();
    
    // First try: exact match with full UUID
    let { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_name,
          product_sku,
          product_hsn_code,
          quantity,
          unit_of_measurement,
          unit_price,
          line_total,
          gst_rate,
          tax_amount
        )
      `)
      .eq('id', searchId)
      .single();

    // If not found with exact match, try RPC function for prefix search
    if (error || !data) {
      console.log('Full UUID match failed, trying partial barcode match...');
      
      // Use a raw query to search by UUID prefix
      // Get the first 12 chars of barcode (without hyphens)
      const barcodePattern = searchId.replace(/-/g, '').substring(0, 12);
      
      // Query all orders and filter client-side by UUID string prefix
      const { data: allOrders, error: allError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            product_sku,
            product_hsn_code,
            quantity,
            unit_of_measurement,
            unit_price,
            line_total,
            gst_rate,
            tax_amount
          )
        `)
        .limit(100); // Limit to avoid fetching too much data

      if (!allError && allOrders && allOrders.length > 0) {
        // Find order by barcode prefix
        const matchedOrder = allOrders.find(order => {
          const orderIdWithoutHyphens = order.id.replace(/-/g, '');
          return orderIdWithoutHyphens.startsWith(barcodePattern);
        });

        if (matchedOrder) {
          data = matchedOrder;
          error = null;
        } else {
          error = new Error(`Order not found with barcode: ${barcodePattern}`);
        }
      } else {
        error = allError || new Error('No orders found in database');
      }
    }

    if (error) {
      throw new Error(`Order not found: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Order not found with ID or barcode: ${orderId}`);
    }

    // If items_snapshot exists, use it; otherwise create from order_items
    if (!data.items_snapshot && data.order_items) {
      data.items_snapshot = data.order_items.map(item => ({
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_hsn_code: item.product_hsn_code,
        quantity: item.quantity,
        unit_of_measurement: item.unit_of_measurement,
        unit_price: item.unit_price,
        line_total: item.line_total,
        gst_rate: item.gst_rate,
        tax_amount: item.tax_amount
      }));
    }

    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

async function logTransaction(orderId, status, details) {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('bridge_transactions')
      .insert([{
        order_id: orderId,
        status: status,
        details: details,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error logging transaction:', error);
  }
}

module.exports = {
  fetchOrderFromDatabase,
  logTransaction,
  getSupabaseClient
};
