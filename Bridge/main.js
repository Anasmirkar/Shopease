const { app, BrowserWindow, Menu, ipcMain, Tray, nativeImage } = require('electron');
const path = require('path');
const { fetchOrderFromDatabase } = require('./src/services/supabaseService');
const { copyToClipboard } = require('./src/services/keyboardService');
require('dotenv').config();

// Disable GPU
app.disableHardwareAcceleration();

let mainWindow;
let tray = null;
let isProcessing = false;

// Barcode scanner listener
let barcodeInputBuffer = '';
let barcodeTimeout;

function createWindow() {
  const fs = require('fs');
  const iconPath = path.join(__dirname, 'assets/icon.png');
  const hasIcon = fs.existsSync(iconPath);
  
  const config = {
    width: 600,
    height: 500,
    minWidth: 500,
    minHeight: 400,
    show: true,  // Show by default
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    }
  };
  
  if (hasIcon) {
    config.icon = iconPath;
  }
  
  mainWindow = new BrowserWindow(config);

  mainWindow.loadFile(path.join(__dirname, 'status.html'));
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
  
  // Keep window focused for keyboard input
  mainWindow.focus();
}

function createTray() {
  try {
    const fs = require('fs');
    let iconPath = path.join(__dirname, 'assets/icon.png');
    
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(__dirname, 'assets/icon.ico');
    }
    
    if (!fs.existsSync(iconPath)) {
      console.log('ℹ️  Icon not found - running without tray icon');
      // Create tray without icon
      tray = new Tray(nativeImage.createEmpty());
    } else {
      try {
        tray = new Tray(iconPath);
        console.log('✅ System tray initialized with icon');
      } catch (e) {
        console.log('ℹ️  Could not load icon - running without tray icon');
        tray = new Tray(nativeImage.createEmpty());
      }
    }
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Status',
        click: () => {
          if (mainWindow) mainWindow.show();
        }
      },
      {
        label: 'Settings',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('show-settings');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('ShopEase Bridge - Listening for barcode scans');
    
    tray.on('click', () => {
      if (mainWindow) mainWindow.show();
    });
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

app.on('ready', () => {
  createWindow();
  createTray();
  setupBarcodeListener();
});

app.on('window-all-closed', () => {
  // Don't quit, keep running in background
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Setup global barcode scanner listener
 */
function setupBarcodeListener() {
  // Global keyboard listener using Electron's native capabilities
  // Listen for keyboard input globally
  const globalShortcut = require('electron').globalShortcut;
  
  // Register shortcut to show window (optional)
  globalShortcut.register('Super+Shift+S', () => {
    if (mainWindow) mainWindow.show();
  });

  // We'll use a simple keypress buffer approach
  // Barcode scanners typically send data very rapidly
  setupKeyboardBuffer();
  
  console.log('✅ Barcode listener initialized');
}

/**
 * Setup keyboard input buffer for barcode detection
 */
function setupKeyboardBuffer() {
  console.log('⚠️  iohook not available. Global keyboard listener disabled.');
  console.log('ℹ️  Using window-focused barcode input instead');
  console.log('✅ Keep Bridge window in focus - barcode input will be captured');
  
  // Setup input handler from the window
  if (mainWindow && mainWindow.webContents) {
    // Listen for before-input-event to capture all keyboard input
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Capture printable characters and enter key
      if (input.type === 'keyDown') {
        // Let the keyDown pass through to capture in the window
        console.log(`🔤 Key pressed: ${input.key}`);
      }
    });
  }
}

/**
 * Watch clipboard for barcode patterns
 */
function setupClipboardWatcher() {
  try {
    const { clipboard } = require('electron');
    let lastClipboard = '';
    let lastCheckTime = 0;
    
    setInterval(() => {
      try {
        const currentClipboard = clipboard.readText();
        const now = Date.now();
        
        // Check if clipboard changed and has barcode-like pattern
        if (currentClipboard !== lastClipboard && 
            currentClipboard.length >= 8 && 
            currentClipboard.length <= 50 &&
            /^[0-9a-f-]{8,}/.test(currentClipboard) &&
            (now - lastCheckTime) > 500) {
          
          lastClipboard = currentClipboard;
          lastCheckTime = now;
          
          console.log(`📋 Clipboard detected potential barcode: ${currentClipboard.substring(0, 20)}`);
          processBarcodeScан(currentClipboard.trim());
        }
      } catch (e) {
        // Ignore clipboard read errors
      }
    }, 300);
    
    console.log('� Clipboard monitor started - copy barcode to clipboard to process');
  } catch (error) {
    console.error('Clipboard watcher setup failed:', error);
  }
}

/**
 * Handle keyboard input and detect barcodes
 */
function handleKeyboardInput(event) {
  try {
    const char = String.fromCharCode(event.keychar);
    barcodeInputBuffer += char;
    
    clearTimeout(barcodeTimeout);
    
    // After 150ms of no input, process the barcode
    barcodeTimeout = setTimeout(async () => {
      const barcode = barcodeInputBuffer.trim();
      
      // Validate barcode (at least 8 characters)
      if (barcode.length >= 8 && !isProcessing) {
        processBarcodeScан(barcode);
      }
      
      barcodeInputBuffer = '';
    }, 150);
  } catch (error) {
    console.error('Keyboard input error:', error);
  }
}

/**
 * Process scanned barcode
 */
async function processBarcodeScан(barcode) {
  isProcessing = true;
  
  try {
    console.log(`📦 Barcode detected: ${barcode}`);
    
    // Fetch order from database
    const order = await fetchOrderFromDatabase(barcode);
    console.log(`✅ Order found: ${order.id}`);
    
    // Format for POS
    const formattedOrder = formatOrderForPOS(order);
    
    // Copy to clipboard
    await copyToClipboard(formattedOrder);
    console.log(`📋 Order copied to clipboard - ready to paste with Ctrl+V`);
    
    // Notify UI
    if (mainWindow) {
      mainWindow.webContents.send('order-scanned', {
        success: true,
        barcode: barcode,
        orderId: order.id,
        itemCount: (order.items_snapshot || []).length,
        total: order.total_amount,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  } catch (error) {
    console.error(`❌ Barcode error: ${error.message}`);
    
    if (mainWindow) {
      mainWindow.webContents.send('order-scanned', {
        success: false,
        error: error.message,
        barcode: barcode,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Format order for POS
 */
function formatOrderForPOS(order) {
  let output = '';
  
  if (order.store_name) {
    output += `${order.store_name}\n`;
    output += '='.repeat(50) + '\n\n';
  }
  
  const items = order.items_snapshot || [];
  items.forEach((item, idx) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const lineTotal = item.line_total || (quantity * unitPrice);
    
    output += `${idx + 1}. ${item.product_name || 'Unknown'}\n`;
    output += `   Qty: ${quantity} x ₹${unitPrice.toFixed(2)} = ₹${lineTotal.toFixed(2)}\n`;
    output += `   HSN: ${item.product_hsn_code || 'N/A'} | GST: ${item.gst_rate || 0}%\n\n`;
  });
  
  output += '='.repeat(50) + '\n';
  output += `Subtotal: ₹${((order.subtotal || 0)).toFixed(2)}\n`;
  output += `Tax (GST): ₹${((order.tax_amount || 0)).toFixed(2)}\n`;
  output += `-`.repeat(50) + '\n';
  output += `TOTAL: ₹${((order.total_amount || 0)).toFixed(2)}\n`;
  output += '='.repeat(50) + '\n\n';
  output += `Order ID: ${order.id}\n`;
  output += `Date: ${new Date(order.created_at).toLocaleString()}\n`;
  
  return output;
}

// IPC Handlers
ipcMain.handle('get-config', async (event) => {
  const { getConfig } = require('./src/services/configService');
  return getConfig();
});

ipcMain.handle('save-config', async (event, config) => {
  const { saveConfig } = require('./src/services/configService');
  try {
    await saveConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-order', async (event, barcode) => {
  try {
    console.log(`🔍 Fetching order for barcode: ${barcode}`);
    const order = await fetchOrderFromDatabase(barcode);
    const formattedOrder = formatOrderForPOS(order);
    
    // Copy to clipboard
    await copyToClipboard(formattedOrder);
    
    return {
      success: true,
      barcode: barcode,
      orderId: order.id,
      itemCount: (order.items_snapshot || []).length,
      total: order.total_amount,
      formatted: formattedOrder,
      timestamp: new Date().toLocaleTimeString()
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      barcode: barcode,
      timestamp: new Date().toLocaleTimeString()
    };
  }
});
