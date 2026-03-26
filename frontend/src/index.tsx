import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/mobileCompatibility'; // Load industry-standard polyfills FIRST
import './index.css';
import App from './App';
import './utils/consoleCleanup'; // Initialize console cleanup first
import './utils/productionLogger'; // Initialize production logging

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);