const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridgeAPI', {
  fetchOrder: (orderId) => ipcRenderer.invoke('fetch-order', orderId),
  pasteToWindow: (text) => ipcRenderer.invoke('paste-to-window', text),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // For logging
  log: (message) => console.log(`[Bridge] ${message}`),
  error: (message) => console.error(`[Bridge Error] ${message}`)
});

// Also expose api object for backward compatibility
contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args))
});
