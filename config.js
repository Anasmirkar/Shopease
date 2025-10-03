export const GOOGLE_AUTH_CONFIG = {
  // Use Android client ID for standalone builds
  androidClientId: '142289263449-7fd303hf91qe07h59h3g031q0sjhq11u.apps.googleusercontent.com',
  // Keep web client for any web usage
  webClientId: '142289263449-1c3hvknhgvs4m2js9u336bhnsfu0gcvh.apps.googleusercontent.com',
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {},
  customParameters: {}
  // No redirectUri needed for standalone Android builds - handled automatically
};
