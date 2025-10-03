/**
 * Product Service
 * Service for handling product-related operations
 */

import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config';

class ProductService {
  /**
   * Scan product by barcode/QR code
   * @param {string} code - Scanned barcode/QR code
   * @returns {Promise} - Product data
   */
  async scanProduct(code) {
    try {
      const response = await apiService.post(API_ENDPOINTS.PRODUCTS.SCAN, {
        code,
      });
      return response;
    } catch (error) {
      console.error('Product scan error:', error);
      throw error;
    }
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise} - Search results
   */
  async searchProducts(query) {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.PRODUCTS.SEARCH}?q=${encodeURIComponent(query)}`
      );
      return response;
    } catch (error) {
      console.error('Product search error:', error);
      throw error;
    }
  }

  /**
   * Get product details
   * @param {string} productId - Product ID
   * @returns {Promise} - Product details
   */
  async getProductDetails(productId) {
    try {
      const endpoint = API_ENDPOINTS.PRODUCTS.DETAILS.replace(':id', productId);
      const response = await apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Get product details error:', error);
      throw error;
    }
  }

  /**
   * Get mock product data (for development/testing)
   * @param {string} code - Scanned code
   * @returns {Object} - Mock product data
   */
  getMockProduct(code) {
    // Mock data for testing
    const mockProducts = {
      '1234567890123': {
        id: '1',
        name: 'Organic Milk 1L',
        price: 65.00,
        weight: '1000ml',
        category: 'Dairy',
        brand: 'Organic Valley',
        image: null,
      },
      '2345678901234': {
        id: '2',
        name: 'Whole Wheat Bread',
        price: 45.00,
        weight: '400g',
        category: 'Bakery',
        brand: 'Fresh Bake',
        image: null,
      },
      '3456789012345': {
        id: '3',
        name: 'Basmati Rice 5kg',
        price: 450.00,
        weight: '5000g',
        category: 'Grains',
        brand: 'Premium',
        image: null,
      },
    };

    return mockProducts[code] || {
      id: Date.now().toString(),
      name: `Product ${code.slice(-4)}`,
      price: Math.floor(Math.random() * 100) + 10,
      weight: `${Math.floor(Math.random() * 1000) + 100}g`,
      category: 'General',
      brand: 'Generic',
      image: null,
    };
  }
}

// Create and export singleton instance
export const productService = new ProductService();
export default productService;