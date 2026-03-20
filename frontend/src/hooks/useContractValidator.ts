/**
 * Contract Validator Hook
 * Centralized input validation for all Web3 contract interactions
 */

import { useMemo } from 'react';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface RaffleCreationParams {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: number;
  duration: number;
}

export interface TicketPurchaseParams {
  raffleContract: string;
  quantity: number;
  ticketPrice: string;
}

export interface WinnerSelectionParams {
  raffleContract: string;
  commitHash?: string;
  nonce?: bigint;
}

export function useContractValidator() {
  // Validate Ethereum address format
  const validateAddress = useMemo(() => {
    return (address: string, fieldName: string = 'address'): ValidationResult => {
      if (!address) {
        return { isValid: false, error: `${fieldName} is required` };
      }
      
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(address)) {
        return { isValid: false, error: `Invalid ${fieldName} format` };
      }
      
      return { isValid: true };
    };
  }, []);

  // Validate numeric string (for prices, token IDs)
  const validateNumericString = useMemo(() => {
    return (value: string, fieldName: string, options?: { min?: number; max?: number }): ValidationResult => {
      if (!value || value.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return { isValid: false, error: `Invalid ${fieldName} format` };
      }
      
      if (options?.min !== undefined && numValue < options.min) {
        return { isValid: false, error: `${fieldName} must be at least ${options.min}` };
      }
      
      if (options?.max !== undefined && numValue > options.max) {
        return { isValid: false, error: `${fieldName} must be at most ${options.max}` };
      }
      
      return { isValid: true };
    };
  }, []);

  // Validate positive integer
  const validatePositiveInteger = useMemo(() => {
    return (value: number, fieldName: string, options?: { min?: number; max?: number }): ValidationResult => {
      if (value === undefined || value === null) {
        return { isValid: false, error: `${fieldName} is required` };
      }
      
      if (!Number.isInteger(value) || value <= 0) {
        return { isValid: false, error: `${fieldName} must be a positive integer` };
      }
      
      if (options?.min !== undefined && value < options.min) {
        return { isValid: false, error: `${fieldName} must be at least ${options.min}` };
      }
      
      if (options?.max !== undefined && value > options.max) {
        return { isValid: false, error: `${fieldName} must be at most ${options.max}` };
      }
      
      return { isValid: true };
    };
  }, []);

  // Validate token ID (string that represents a valid integer)
  const validateTokenId = useMemo(() => {
    return (tokenId: string): ValidationResult => {
      if (!tokenId || tokenId.trim() === '') {
        return { isValid: false, error: 'Token ID is required' };
      }
      
      const numValue = parseInt(tokenId);
      if (isNaN(numValue) || numValue < 0) {
        return { isValid: false, error: 'Invalid token ID' };
      }
      
      return { isValid: true };
    };
  }, []);

  // Validate ticket price (ETH amount)
  const validateTicketPrice = useMemo(() => {
    return (price: string): ValidationResult => {
      const result = validateNumericString(price, 'ticket price', { min: 0.000001, max: 1000 });
      if (!result.isValid) {
        return result;
      }
      
      // Additional check for reasonable decimal places
      const decimalPlaces = (price.split('.')[1] || '').length;
      if (decimalPlaces > 18) {
        return { isValid: false, error: 'Ticket price has too many decimal places (max 18)' };
      }
      
      return { isValid: true };
    };
  }, [validateNumericString]);

  // Validate raffle creation parameters
  const validateRaffleCreation = useMemo(() => {
    return (params: RaffleCreationParams): ValidationResult => {
      // Validate NFT contract address
      const nftContractResult = validateAddress(params.nftContract, 'NFT contract address');
      if (!nftContractResult.isValid) {
        return nftContractResult;
      }
      
      // Validate token ID
      const tokenIdResult = validateTokenId(params.tokenId);
      if (!tokenIdResult.isValid) {
        return tokenIdResult;
      }
      
      // Validate ticket price
      const ticketPriceResult = validateTicketPrice(params.ticketPrice);
      if (!ticketPriceResult.isValid) {
        return ticketPriceResult;
      }
      
      // Validate max tickets
      const maxTicketsResult = validatePositiveInteger(params.maxTickets, 'max tickets', { min: 1, max: 10000 });
      if (!maxTicketsResult.isValid) {
        return maxTicketsResult;
      }
      
      // Validate duration (in hours)
      const durationResult = validatePositiveInteger(params.duration, 'duration', { min: 1, max: 8760 }); // max 1 year
      if (!durationResult.isValid) {
        return durationResult;
      }
      
      return { isValid: true };
    };
  }, [validateAddress, validateTokenId, validateTicketPrice, validatePositiveInteger]);

  // Validate ticket purchase parameters
  const validateTicketPurchase = useMemo(() => {
    return (params: TicketPurchaseParams): ValidationResult => {
      // Validate raffle contract address
      const raffleContractResult = validateAddress(params.raffleContract, 'raffle contract address');
      if (!raffleContractResult.isValid) {
        return raffleContractResult;
      }
      
      // Validate quantity
      const quantityResult = validatePositiveInteger(params.quantity, 'quantity', { min: 1, max: 1000 });
      if (!quantityResult.isValid) {
        return quantityResult;
      }
      
      // Validate ticket price
      const ticketPriceResult = validateTicketPrice(params.ticketPrice);
      if (!ticketPriceResult.isValid) {
        return ticketPriceResult;
      }
      
      return { isValid: true };
    };
  }, [validateAddress, validatePositiveInteger, validateTicketPrice]);

  // Validate NFT approval parameters
  const validateNFTApproval = useMemo(() => {
    return (nftContract: string): ValidationResult => {
      return validateAddress(nftContract, 'NFT contract address');
    };
  }, [validateAddress]);

  // Validate winner selection parameters
  const validateWinnerSelection = useMemo(() => {
    return (params: WinnerSelectionParams): ValidationResult => {
      // Validate raffle contract address
      const raffleContractResult = validateAddress(params.raffleContract, 'raffle contract address');
      if (!raffleContractResult.isValid) {
        return raffleContractResult;
      }
      
      // Validate commit hash if provided
      if (params.commitHash) {
        const commitHashRegex = /^0x[a-fA-F0-9]{64}$/;
        if (!commitHashRegex.test(params.commitHash)) {
          return { isValid: false, error: 'Invalid commit hash format' };
        }
      }
      
      // Validate nonce if provided
      if (params.nonce !== undefined) {
        if (typeof params.nonce !== 'bigint' || params.nonce < 0n) {
          return { isValid: false, error: 'Invalid nonce value' };
        }
      }
      
      return { isValid: true };
    };
  }, [validateAddress]);

  return {
    // Individual validators
    validateAddress,
    validateNumericString,
    validatePositiveInteger,
    validateTokenId,
    validateTicketPrice,
    
    // Composite validators
    validateRaffleCreation,
    validateTicketPurchase,
    validateNFTApproval,
    validateWinnerSelection
  };
}

