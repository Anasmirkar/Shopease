/**
 * API Configuration
 * Centralized API configuration and endpoints
 */

import { AppConstants } from '../constants';

// API Configuration
export const API_CONFIG = {
  BASE_URL: AppConstants.API_BASE_URL,
  TIMEOUT: AppConstants.API_TIMEOUT,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    VERIFY_OTP: '/verify-otp',
    GUEST_LOGIN: '/guest-login',
    LOGOUT: '/logout',
  },
  
  // User Management
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/update-profile',
    DELETE_ACCOUNT: '/user/delete-account',
  },
  
  // Stores
  STORES: {
    LIST: '/stores',
    DETAILS: '/stores/:id',
    SEARCH: '/stores/search',
  },
  
  // Products
  PRODUCTS: {
    SCAN: '/products/scan',
    SEARCH: '/products/search',
    DETAILS: '/products/:id',
  },
  
  // Shopping History
  SHOPPING: {
    HISTORY: '/shopping-history/:userId',
    SAVE: '/save-shopping-history',
    RECEIPT: '/shopping/receipt/:id',
  },
  
  // Payments
  PAYMENTS: {
    PROCESS: '/payments/process',
    VERIFY: '/payments/verify',
    HISTORY: '/payments/history/:userId',
  },
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export default API_CONFIG;