const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.shopease-bridge');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  keyboardDelay: 50,
  autoPaste: false,
  version: '1.0.0'
};

/**
 * Get configuration from file
 */
function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error reading config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
  try {
    // Validate required fields
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase URL and Key are required');
    }

    // Merge with existing config to preserve other settings
    const existingConfig = getConfig();
    const mergedConfig = {
      ...existingConfig,
      ...config
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(mergedConfig, null, 2), 'utf-8');
    console.log('Config saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

/**
 * Reset configuration to defaults
 */
function resetConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    console.log('Config reset to defaults');
    return { success: true };
  } catch (error) {
    console.error('Error resetting config:', error);
    throw error;
  }
}

/**
 * Get config file path (for debugging)
 */
function getConfigPath() {
  return CONFIG_FILE;
}

module.exports = {
  getConfig,
  saveConfig,
  resetConfig,
  getConfigPath,
  DEFAULT_CONFIG
};
