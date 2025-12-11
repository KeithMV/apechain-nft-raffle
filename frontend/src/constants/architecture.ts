/**
 * Architecture Constants
 * Centralized constants for consistent architecture patterns
 */

// Component sizes
export const COMPONENT_SIZES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  SHORT: 30 * 1000,      // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000,  // 15 minutes
  VERY_LONG: 60 * 60 * 1000 // 1 hour
} as const;

// Rate limiting
export const RATE_LIMITS = {
  WALLET_CONNECT: { requests: 5, windowMs: 60000 },
  API_CALLS: { requests: 100, windowMs: 60000 },
  METADATA_FETCH: { requests: 50, windowMs: 60000 }
} as const;

// Data size limits
export const SIZE_LIMITS = {
  CACHE_ITEM: 100000,    // 100KB
  RESPONSE_BODY: 100000, // 100KB
  STRING_INPUT: 1000,    // 1KB
  ARRAY_LENGTH: 50       // 50 items
} as const;

// Network timeouts
export const TIMEOUTS = {
  FETCH: 10000,     // 10 seconds
  IMAGE_LOAD: 8000, // 8 seconds
  CONTRACT_CALL: 15000 // 15 seconds
} as const;

// Component display names for debugging
export const COMPONENT_NAMES = {
  NFT_IMAGE: 'UnifiedNFTImage',
  WALLET_CONNECTION: 'ProfessionalWalletConnection',
  RAFFLE_DASHBOARD: 'RaffleDashboard',
  BROWSE_RAFFLES: 'BrowseRaffles'
} as const;

export type ComponentSize = keyof typeof COMPONENT_SIZES;
export type CacheDuration = keyof typeof CACHE_DURATIONS;
export type RateLimit = keyof typeof RATE_LIMITS;