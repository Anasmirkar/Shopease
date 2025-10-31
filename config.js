export const GOOGLE_AUTH_CONFIG = {
  // Use Android client ID for standalone builds
  androidClientId: '142289263449-v0hig021veh450nvrigav2hp7u8ard8e.apps.googleusercontent.com',
  // Keep web client for any web usage
  webClientId: '142289263449-1c3hvknhgvs4m2js9u336bhnsfu0gcvh.apps.googleusercontent.com',
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {},
  customParameters: {}
  // No redirectUri needed for standalone Android builds - handled automatically
};

export const API_CONFIG = {
  BASE_URL: 'https://shopease-backend-yvf4.onrender.com',
  TIMEOUT: 10000,
  ENDPOINTS: {
    REGISTER: '/register',
    LOGIN: '/login',
    SAVE_SHOPPING_HISTORY: '/save-shopping-history',
    GET_SHOPPING_HISTORY: '/shopping-history'
  }
};
