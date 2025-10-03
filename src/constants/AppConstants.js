/**
 * Application Constants
 * General application constants and configuration values
 */

export const AppConstants = {
  // App Info
  APP_NAME: 'ShopEase',
  APP_VERSION: '1.0.0',
  
  // API Configuration
  API_BASE_URL: 'http://192.168.78.175:3000',
  API_TIMEOUT: 10000,
  
  // Scanner Configuration
  SCANNER_TIMEOUT: 25000, // 25 seconds
  SCANNER_BARCODE_TYPES: ['qr', 'code128', 'ean13'],
  
  // Animation Configuration
  SCAN_LINE_DURATION: 1500,
  PULSE_DURATION: 1000,
  CORNER_GLOW_DURATION: 1500,
  PARTICLES_DURATION: 3000,
  
  // Receipt Configuration
  RECEIPT_NUMBER_LENGTH: 6,
  
  // Storage Keys
  STORAGE_KEYS: {
    USER_DATA: '@ShopEase:userData',
    SELECTED_STORE: '@ShopEase:selectedStore',
    SHOPPING_HISTORY: '@ShopEase:shoppingHistory',
    APP_SETTINGS: '@ShopEase:appSettings',
  },
  
  // Validation Rules
  VALIDATION: {
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,
    OTP_LENGTH: 4,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
    CAMERA_PERMISSION: 'Camera permission is required to scan barcodes.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    INVALID_OTP: 'Please enter a valid OTP.',
    INVALID_NAME: 'Please enter a valid name.',
    GENERIC_ERROR: 'Something went wrong. Please try again.',
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Login successful!',
    SIGNUP_SUCCESS: 'Account created successfully!',
    OTP_VERIFIED: 'OTP verified successfully!',
    PRODUCT_SCANNED: 'Product scanned successfully!',
    PAYMENT_SUCCESS: 'Payment completed successfully!',
  },
};

export default AppConstants;