import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/mobileCompatibility'; // Load industry-standard polyfills FIRST
import './index.css';
import App from './App';
import './utils/consoleCleanup'; // Initialize console cleanup first
import './utils/productionLogger'; // Initialize production logging

// MOBILE SAFARI DEBUG: Enhanced React mounting
console.log('📱 [MOBILE-MOUNT] Starting React mounting process...');
console.log('📱 [MOBILE-MOUNT] User Agent:', navigator.userAgent);
console.log('📱 [MOBILE-MOUNT] Document ready state:', document.readyState);

const rootElement = document.getElementById('root');
console.log('📱 [MOBILE-MOUNT] Root element found:', !!rootElement);

if (!rootElement) {
  console.error('🚨 [MOBILE-ERROR] Root element not found!');
  throw new Error('Root element not found');
}

try {
  console.log('📱 [MOBILE-MOUNT] Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('📱 [MOBILE-MOUNT] Rendering App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ [MOBILE-MOUNT] React render call completed successfully!');
} catch (error) {
  console.error('🚨 [MOBILE-ERROR] React mounting failed:', error);
  
  // Fallback: Try without StrictMode for mobile Safari
  console.log('🔄 [MOBILE-FALLBACK] Trying without StrictMode...');
  try {
    const fallbackRoot = ReactDOM.createRoot(rootElement);
    fallbackRoot.render(<App />);
    console.log('✅ [MOBILE-FALLBACK] Fallback render successful!');
  } catch (fallbackError) {
    console.error('🚨 [MOBILE-ERROR] Fallback render also failed:', fallbackError);
  }
}