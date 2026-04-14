/**
 * CONFIGURATION FEATURE FLAG
 * Switch between complex unified system and simplified system
 * 
 * Set USE_SIMPLIFIED_CONFIG=true to test new system
 * Set USE_SIMPLIFIED_CONFIG=false to use old system
 */

// Feature flag - change this to test simplified system
export const USE_SIMPLIFIED_CONFIG = process.env.REACT_APP_USE_SIMPLIFIED_CONFIG === 'true' || false;

// Debug logging
if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
  console.log(`🔧 Configuration mode: ${USE_SIMPLIFIED_CONFIG ? 'SIMPLIFIED' : 'UNIFIED'}`);
}