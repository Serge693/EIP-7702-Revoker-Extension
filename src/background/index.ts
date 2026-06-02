/// <reference types="chrome" />

console.log('✅ EIP-7702 Revoker Background Service Worker started');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
});

chrome.runtime.onMessage.addListener((
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log('Background received message:', message);

  if (message.type === 'PING') {
    sendResponse({ status: 'ok', version: '1.0.0' });
    return true;
  }

  if (message.type === 'REVOKE_EIP7702') {
    sendResponse({ status: 'received' });
    return true;
  }
});