import { keccak256, encodePacked } from 'viem';
import { CSRFProtection } from '../utils/csrfProtection';

/**
 * Winner Selection Service - Proper commit-reveal implementation
 * Matches smart contract's keccak256 hash requirements
 * CSRF-protected with origin validation
 */
export class WinnerSelectionService {
  /**
   * Generate cryptographically secure nonce and proper keccak256 hash
   */
  static generateCommitReveal(): { nonce: bigint; commitHash: string } {
    // Generate cryptographically secure 32-byte random number
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const nonce = BigInt('0x' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));
    
    // Create proper keccak256 hash that matches contract expectation
    const commitHash = keccak256(encodePacked(['uint256'], [nonce]));
    
    return { nonce, commitHash };
  }

  static storeCommitData(raffleContract: string, nonce: bigint): void {
    CSRFProtection.validateOrigin();
    const sanitizedContract = CSRFProtection.sanitizeContractAddress(raffleContract);
    localStorage.setItem(`commit_${sanitizedContract}`, nonce.toString());
  }

  static getStoredNonce(raffleContract: string): bigint | null {
    CSRFProtection.validateOrigin();
    
    try {
      const sanitizedContract = CSRFProtection.sanitizeContractAddress(raffleContract);
      const stored = localStorage.getItem(`commit_${sanitizedContract}`);
      return stored ? BigInt(stored) : null;
    } catch {
      return null;
    }
  }

  static clearCommitData(raffleContract: string): void {
    CSRFProtection.validateOrigin();
    
    try {
      const sanitizedContract = CSRFProtection.sanitizeContractAddress(raffleContract);
      localStorage.removeItem(`commit_${sanitizedContract}`);
    } catch {
      // Silently fail for invalid addresses
    }
  }

  /**
   * Verify that a nonce produces the expected hash (for testing)
   */
  static verifyCommit(nonce: bigint, expectedHash: string): boolean {
    const computedHash = keccak256(encodePacked(['uint256'], [nonce]));
    return computedHash.toLowerCase() === expectedHash.toLowerCase();
  }
}