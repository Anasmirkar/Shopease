// Test script to check redirect URI
import * as AuthSession from 'expo-auth-session';

console.log('Testing redirect URIs:');

// With useProxy: true (for development with Expo Go)
const proxyRedirect = AuthSession.makeRedirectUri({
  scheme: 'scanto',
  useProxy: true
});
console.log('Proxy redirect URI:', proxyRedirect);

// Without proxy (for standalone builds)
const directRedirect = AuthSession.makeRedirectUri({
  scheme: 'scanto',
  useProxy: false
});
console.log('Direct redirect URI:', directRedirect);

// Auto-detect (recommended)
const autoRedirect = AuthSession.makeRedirectUri({
  scheme: 'scanto'
});
console.log('Auto redirect URI:', autoRedirect);