/**
 * Authentication Service
 * Service for handling authentication operations
 */

import { supabase, TABLES } from '../config';
import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config';
import { generateDeviceId } from '../utils';

class AuthService {
  /**
   * Login with phone and password
   * @param {string} phone - User phone number
   * @param {string} password - User password
   * @returns {Promise} - Login response
   */
  async login(phone, password) {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
        phone,
        password,
      });
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Sign up new user
   * @param {Object} userData - User data
   * @returns {Promise} - Signup response
   */
  async signup(userData) {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @param {string} name - User name
   * @returns {Promise} - Verification response
   */
  async verifyOTP(phone, otp, name) {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        phone,
        otp,
        name,
      });
      return response;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }

  /**
   * Guest login
   * @returns {Promise} - Guest login response
   */
  async guestLogin() {
    try {
      const deviceId = generateDeviceId();
      
      // First try to find existing guest record
      let { data, error } = await supabase
        .from(TABLES.GUESTS)
        .select()
        .eq('device_id', deviceId)
        .single();
      
      // If no existing record found, create new one
      if (error && error.code === 'PGRST116') {
        // Get first available store
        const { data: stores, error: storeError } = await supabase
          .from(TABLES.STORES)
          .select('id')
          .limit(1);
        
        if (storeError || !stores || stores.length === 0) {
          throw new Error('No stores found. Please set up a store first.');
        }
        
        const storeId = stores[0].id;
        
        const insertResult = await supabase
          .from(TABLES.GUESTS)
          .insert([{ device_id: deviceId, store_id: storeId }])
          .select()
          .single();
        data = insertResult.data;
        error = insertResult.error;
      }

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: { guest: true, ...data } };
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @returns {Promise} - Logout response
   */
  async logout() {
    try {
      // Clear any stored authentication data
      await supabase.auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user session
   * @returns {Promise} - Current session
   */
  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;