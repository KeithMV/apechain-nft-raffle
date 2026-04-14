/**
 * SIMPLIFIED CONFIGURATION - CLEANUP COMPLETE
 * The simplified configuration is now the default and only system
 * 
 * Old unified configuration has been removed:
 * - ChainConfigProvider.tsx (removed)
 * - unified.ts (removed) 
 * - wagmiUnified.ts (removed)
 * 
 * New simplified system:
 * - wagmi.ts (direct wagmi configuration)
 * - AppProvidersSimple.tsx (clean provider setup)
 * - useSimpleChainConfig.ts (basic utilities)
 */

// Simplified configuration is now the only configuration
export const USE_SIMPLIFIED_CONFIG = true;

// Debug logging
if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
  console.log('🎯 Configuration: SIMPLIFIED (cleanup complete)');
}