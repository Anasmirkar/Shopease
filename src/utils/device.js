/**
 * Device Utilities
 * Device-related utility functions
 */

import * as Device from 'expo-device';

/**
 * Generate a unique device ID
 * @returns {string} - Unique device identifier
 */
export const generateDeviceId = () => {
  try {
    return Device.osInternalBuildId || 
           Device.deviceName || 
           Device.modelId || 
           Device.osBuildId || 
           Math.random().toString(36).substring(2, 15);
  } catch (error) {
    console.log('Error generating device ID:', error);
    return Math.random().toString(36).substring(2, 15);
  }
};

/**
 * Get device information
 * @returns {Object} - Device information object
 */
export const getDeviceInfo = () => {
  try {
    return {
      deviceName: Device.deviceName || 'Unknown Device',
      modelName: Device.modelName || 'Unknown Model',
      osName: Device.osName || 'Unknown OS',
      osVersion: Device.osVersion || 'Unknown Version',
      platform: Device.platform || 'Unknown Platform',
      isDevice: Device.isDevice,
    };
  } catch (error) {
    console.log('Error getting device info:', error);
    return {
      deviceName: 'Unknown Device',
      modelName: 'Unknown Model',
      osName: 'Unknown OS',
      osVersion: 'Unknown Version',
      platform: 'Unknown Platform',
      isDevice: false,
    };
  }
};

/**
 * Check if device is a tablet
 * @returns {boolean} - Whether device is a tablet
 */
export const isTablet = () => {
  try {
    return Device.deviceType === Device.DeviceType.TABLET;
  } catch (error) {
    return false;
  }
};