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
      .from('receipts')
      .select(`
        *,
        receipt_items (
          product_name,
          barcode as product_sku,
          hsn_code as product_hsn_code,
          quantity,
          unit as unit_of_measurement,
          unit_price,
          line_total,
          tax_rate as gst_rate,
          tax_amount
        )
      `)
      .eq('receipt_code', searchId)
      .single();

    // If not found with exact match, try RPC function for prefix search
    if (error || !data) {
      console.log('Full UUID match failed, trying partial barcode match...');
      
      // Use a raw query to search by UUID prefix
      // Get the first 12 chars of barcode (without hyphens)
      const barcodePattern = searchId.replace(/-/g, '').substring(0, 12);
      
      // Query all receipts and filter client-side by receipt_code prefix
      const { data: allReceipts, error: allError } = await supabase
        .from('receipts')
        .select(`
          *,
          receipt_items (
            product_name,
            barcode as product_sku,
            hsn_code as product_hsn_code,
            quantity,
            unit as unit_of_measurement,
            unit_price,
            line_total,
            tax_rate as gst_rate,
            tax_amount
          )
        `)
        .limit(100); // Limit to avoid fetching too much data

      if (!allError && allReceipts && allReceipts.length > 0) {
        // Find receipt by receipt_code prefix
        const matchedReceipt = allReceipts.find(receipt => {
          return receipt.receipt_code.startsWith(barcodePattern);
        });

        if (matchedReceipt) {
          data = matchedReceipt;
          error = null;
        } else {
          error = new Error(`Receipt not found with barcode: ${barcodePattern}`);
        }
      } else {
        error = allError || new Error('No receipts found in database');
      }
    }

    if (error) {
      throw new Error(`Order not found: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Order not found with ID or barcode: ${orderId}`);
    }

    // If items_snapshot exists, use it; otherwise create from receipt_items
    if (!data.items_snapshot && data.receipt_items) {
      data.items_snapshot = data.receipt_items.map(item => ({
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

async function logTransaction(receiptId, status, details) {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('sync_logs')
      .insert([{
        entity_id: receiptId,
        entity_type: 'receipt',
        sync_type: 'RECEIPT',
        source_system: 'bridge_app',
        status: status,
        details: details ? JSON.stringify(details) : null
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
