/**
 * Formatting Utilities
 * Common formatting functions for data presentation
 */

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = '₹') => {
  if (typeof amount !== 'number') return `${currency}0.00`;
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  }
  return phone;
};

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format time
 * @param {Date|string} time - Time to format
 * @returns {string} - Formatted time string (HH:MM AM/PM)
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  const timeObj = time instanceof Date ? time : new Date(time);
  if (isNaN(timeObj.getTime())) return '';
  
  return timeObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format weight
 * @param {number} weight - Weight in grams
 * @returns {string} - Formatted weight string
 */
export const formatWeight = (weight) => {
  if (typeof weight !== 'number') return '0g';
  
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)}kg`;
  }
  return `${weight}g`;
};

/**
 * Generate receipt number
 * @returns {string} - Generated receipt number
 */
export const generateReceiptNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RCP${timestamp}${random}`;
};

/**
 * Format product name
 * @param {string} name - Product name to format
 * @param {number} maxLength - Maximum length (default: 30)
 * @returns {string} - Formatted product name
 */
export const formatProductName = (name, maxLength = 30) => {
  if (!name) return 'Unknown Product';
  
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength - 3)}...`;
};

/**
 * Calculate total amount
 * @param {Array} products - Array of products with price and quantity
 * @returns {number} - Total amount
 */
export const calculateTotal = (products) => {
  if (!Array.isArray(products)) return 0;
  
  return products.reduce((total, product) => {
    const price = parseFloat(product.price) || 0;
    const quantity = parseInt(product.quantity) || 1;
    return total + (price * quantity);
  }, 0);
};