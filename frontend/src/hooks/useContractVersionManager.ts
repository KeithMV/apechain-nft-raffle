/**
 * Contract Version Manager Hook
 * Centralized version detection, configuration, and factory address resolution
 */

import { useState, useEffect, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getFactoryAddress, getChainConfig } from '../config/addresses';

export interface VersionConfig {
  v4Available: boolean;
  currentVersion: 'v4';
  factoryAddress: string;
  rateLimit: number;
  rateLimitText: string;
}

export interface ContractAddresses {
  factoryAddress: string;
  isV4: boolean;
}

export function useContractVersionManager() {
  const chainId = useChainId();
  
  // Always V4 now - simplified
  const currentVersion = 'v4' as const;
  const v4Available = true;

  // Memoized version configuration
  const versionConfig = useMemo((): VersionConfig => {
    const chainConfig = getChainConfig(chainId);
    
    return {
      v4Available: true,
      currentVersion: 'v4',
      factoryAddress: chainConfig.factory,
      rateLimit: chainConfig.rateLimit,
      rateLimitText: `${chainConfig.rateLimit} seconds`
    };
  }, [chainId]);

  // Get factory address for current version (always V4)
  const getFactoryAddress = useMemo(() => {
    return (): ContractAddresses => {
      const chainConfig = getChainConfig(chainId);
      
      return {
        factoryAddress: chainConfig.factory,
        isV4: true
      };
    };
  }, [chainId]);

  // Check if specific version is available (always true for V4)
  const isVersionAvailable = useMemo(() => {
    return (version: 'v3' | 'v4'): boolean => {
      return version === 'v4'; // Only V4 supported now
    };
  }, []);

  // Get rate limit info for version (always V4)
  const getRateLimitInfo = useMemo(() => {
    return () => {
      const chainConfig = getChainConfig(chainId);
      
      return {
        rateLimit: chainConfig.rateLimit,
        rateLimitText: `${chainConfig.rateLimit} seconds`,
        version: 'v4' as const
      };
    };
  }, [chainId]);

  return {
    // Current version info
    ...versionConfig,
    
    // Utility functions
    getFactoryAddress,
    isVersionAvailable,
    getRateLimitInfo,
    
    // Chain info
    chainId
  };
}

