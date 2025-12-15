const { clipboard } = require('electron');

/**
 * Copy text to clipboard 
 * App will use this for barcode-triggered copies
 */
async function copyToClipboard(text) {
  try {
    clipboard.writeText(text);
    console.log('✓ Text copied to clipboard');
    return {
      success: true,
      message: 'Text copied to clipboard'
    };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw new Error(`Failed to copy text: ${error.message}`);
  }
}

/**
 * Legacy function for UI compatibility
 */
async function pasteToActiveWindow(text) {
  return copyToClipboard(text);
}

/**
 * Get clipboard contents
 */
function getClipboardContents() {
  try {
    return clipboard.readText();
  } catch (error) {
    console.error('Error reading clipboard:', error);
    return null;
  }
}

module.exports = {
  copyToClipboard,
  pasteToActiveWindow,
  getClipboardContents
};
