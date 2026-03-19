/**
 * Contract Version Manager Hook
 * Centralized version detection, configuration, and factory address resolution
 */

import { useState, useEffect, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getRaffleFactoryAddress, isV4Available, getRateLimit } from '../config/addresses';

export interface VersionConfig {
  v4Available: boolean;
  currentVersion: 'v3' | 'v4';
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
  const [v4Available, setV4Available] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<'v3' | 'v4'>('v3');

  // Update version info when chain changes
  useEffect(() => {
    const checkV4 = isV4Available(chainId);
    setV4Available(checkV4);
    setCurrentVersion(checkV4 ? 'v4' : 'v3');
  }, [chainId]);

  // Memoized version configuration
  const versionConfig = useMemo((): VersionConfig => {
    const factoryAddress = getRaffleFactoryAddress(chainId, currentVersion === 'v4');
    const rateLimit = getRateLimit(currentVersion === 'v4');
    
    return {
      v4Available,
      currentVersion,
      factoryAddress,
      rateLimit,
      rateLimitText: currentVersion === 'v4' ? '10 seconds' : '5 minutes'
    };
  }, [chainId, v4Available, currentVersion]);

  // Get factory address for current version
  const getFactoryAddress = useMemo(() => {
    return (forceVersion?: 'v3' | 'v4'): ContractAddresses => {
      const version = forceVersion || currentVersion;
      const isV4 = version === 'v4';
      
      return {
        factoryAddress: getRaffleFactoryAddress(chainId, isV4),
        isV4
      };
    };
  }, [chainId, currentVersion]);

  // Check if specific version is available
  const isVersionAvailable = useMemo(() => {
    return (version: 'v3' | 'v4'): boolean => {
      if (version === 'v3') return true; // V3 always available
      return isV4Available(chainId);
    };
  }, [chainId]);

  // Get rate limit info for version
  const getRateLimitInfo = useMemo(() => {
    return (version?: 'v3' | 'v4') => {
      const targetVersion = version || currentVersion;
      const rateLimit = getRateLimit(targetVersion === 'v4');
      
      return {
        rateLimit,
        rateLimitText: targetVersion === 'v4' ? '10 seconds' : '5 minutes',
        version: targetVersion
      };
    };
  }, [currentVersion]);

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

