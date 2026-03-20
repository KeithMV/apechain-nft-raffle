/**
 * Validation Rules Configuration
 * Centralized validation rules for consistent input validation
 */

export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

/**
 * Standard validation rules for common input types
 */
export const ValidationRules = {
  address: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Invalid Ethereum address format'
  },
  tokenId: {
    required: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    message: 'Token ID must be a positive number'
  },
  ticketPrice: {
    required: true,
    min: 0.001,
    max: 1000000,
    message: 'Ticket price must be between 0.001 and 1,000,000 APE'
  },
  maxTickets: {
    required: true,
    min: 1,
    max: 10000,
    message: 'Max tickets must be between 1 and 10,000'
  },
  duration: {
    required: true,
    min: 1,
    max: 168,
    message: 'Duration must be between 1 and 168 hours'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  },
  url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'Invalid URL format'
  }
} as const;

/**
 * Web3-specific validation rules
 */
export const Web3ValidationRules = {
  ethereumAddress: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Invalid Ethereum address'
  },
  transactionHash: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{64}$/,
    message: 'Invalid transaction hash'
  },
  privateKey: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{64}$/,
    message: 'Invalid private key format'
  },
  chainId: {
    required: true,
    min: 1,
    max: 999999999,
    message: 'Invalid chain ID'
  }
} as const;

/**
 * NFT-specific validation rules
 */
export const NFTValidationRules = {
  tokenId: {
    required: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    message: 'Invalid token ID'
  },
  contractAddress: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Invalid NFT contract address'
  },
  metadataUri: {
    required: false,
    pattern: /^(https?:\/\/|ipfs:\/\/)/,
    message: 'Invalid metadata URI'
  }
} as const;

/**
 * Raffle-specific validation rules
 */
export const RaffleValidationRules = {
  ticketPrice: {
    required: true,
    min: 0.001,
    max: 1000000,
    message: 'Ticket price must be between 0.001 and 1,000,000'
  },
  maxTickets: {
    required: true,
    min: 1,
    max: 10000,
    message: 'Max tickets must be between 1 and 10,000'
  },
  duration: {
    required: true,
    min: 3600, // 1 hour in seconds
    max: 604800, // 1 week in seconds
    message: 'Duration must be between 1 hour and 1 week'
  },
  ticketQuantity: {
    required: true,
    min: 1,
    max: 100,
    message: 'Ticket quantity must be between 1 and 100'
  }
} as const;

/**
 * Create custom validation rule
 */
export function createValidationRule(options: ValidationRule): ValidationRule {
  return { ...options };
}

/**
 * Combine multiple validation rule sets
 */
export function combineValidationRules(...ruleSets: Record<string, ValidationRule>[]): Record<string, ValidationRule> {
  return Object.assign({}, ...ruleSets);
}