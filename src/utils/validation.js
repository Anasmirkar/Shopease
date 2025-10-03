/**
 * Validation Utilities
 * Common validation functions used throughout the app
 */

import { AppConstants } from '../constants';

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
  return cleanPhone.length >= AppConstants.VALIDATION.PHONE_MIN_LENGTH && 
         cleanPhone.length <= AppConstants.VALIDATION.PHONE_MAX_LENGTH;
};

/**
 * Validate OTP
 * @param {string} otp - OTP to validate
 * @returns {boolean} - Whether the OTP is valid
 */
export const validateOTP = (otp) => {
  if (!otp || typeof otp !== 'string') return false;
  
  const otpRegex = new RegExp(`^\\d{${AppConstants.VALIDATION.OTP_LENGTH}}$`);
  return otpRegex.test(otp);
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {boolean} - Whether the name is valid
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmedName = name.trim();
  return trimmedName.length >= AppConstants.VALIDATION.NAME_MIN_LENGTH && 
         trimmedName.length <= AppConstants.VALIDATION.NAME_MAX_LENGTH;
};

/**
 * Validate email (optional)
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get validation error message
 * @param {string} field - Field name
 * @param {*} value - Value to validate
 * @returns {string|null} - Error message or null if valid
 */
export const getValidationError = (field, value) => {
  switch (field) {
    case 'phone':
      return !validatePhone(value) ? AppConstants.ERROR_MESSAGES.INVALID_PHONE : null;
    case 'otp':
      return !validateOTP(value) ? AppConstants.ERROR_MESSAGES.INVALID_OTP : null;
    case 'name':
      return !validateName(value) ? AppConstants.ERROR_MESSAGES.INVALID_NAME : null;
    case 'email':
      return !validateEmail(value) ? 'Please enter a valid email address.' : null;
    default:
      return null;
  }
};