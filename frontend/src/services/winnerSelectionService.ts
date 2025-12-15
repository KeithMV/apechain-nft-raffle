import { keccak256, encodePacked } from 'viem';

/**
 * Winner Selection Service - Proper commit-reveal implementation
 * Matches smart contract's keccak256 hash requirements
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
    localStorage.setItem(`commit_${raffleContract}`, nonce.toString());
  }

  static getStoredNonce(raffleContract: string): bigint | null {
    const stored = localStorage.getItem(`commit_${raffleContract}`);
    return stored ? BigInt(stored) : null;
  }

  static clearCommitData(raffleContract: string): void {
    localStorage.removeItem(`commit_${raffleContract}`);
  }

  /**
   * Verify that a nonce produces the expected hash (for testing)
   */
  static verifyCommit(nonce: bigint, expectedHash: string): boolean {
    const computedHash = keccak256(encodePacked(['uint256'], [nonce]));
    return computedHash.toLowerCase() === expectedHash.toLowerCase();
  }
}