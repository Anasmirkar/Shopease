/**
 * API Service
 * Centralized API service for making HTTP requests
 */

import { AppConstants } from '../constants';
import { API_CONFIG, HTTP_METHODS } from '../config';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.headers = API_CONFIG.HEADERS;
  }

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method: options.method || HTTP_METHODS.GET,
      headers: {
        ...this.headers,
        ...options.headers,
      },
      ...options,
    };

    if (config.method !== HTTP_METHODS.GET && options.data) {
      config.body = JSON.stringify(options.data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API Request Error [${endpoint}]:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw new Error(error.message || AppConstants.ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: HTTP_METHODS.GET });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: HTTP_METHODS.POST,
      data,
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: HTTP_METHODS.PUT,
      data,
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: HTTP_METHODS.DELETE });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: HTTP_METHODS.PATCH,
      data,
    });
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;