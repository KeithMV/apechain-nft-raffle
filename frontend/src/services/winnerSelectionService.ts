import { keccak256, toBytes, isAddress } from 'viem/utils';

export class WinnerSelectionService {
  private static validateContractAddress(address: string): void {
    if (!address || !isAddress(address)) {
      throw new Error('Invalid contract address');
    }
  }

  static generateCommitReveal(): { nonce: bigint; commitHash: string } {
    // Use cryptographically secure random number generation
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    const nonce = BigInt(array[0]) * BigInt(2**32) + BigInt(array[1]);
    const commitHash = keccak256(toBytes(nonce.toString()));
    return { nonce, commitHash };
  }

  static storeCommitData(raffleContract: string, nonce: bigint): void {
    this.validateContractAddress(raffleContract);
    if (nonce <= 0n) {
      throw new Error('Invalid nonce value');
    }
    try {
      localStorage.setItem(`commit_${raffleContract}`, nonce.toString());
    } catch (error) {
      throw new Error('Failed to store commit data');
    }
  }

  static getStoredNonce(raffleContract: string): bigint | null {
    this.validateContractAddress(raffleContract);
    try {
      const stored = localStorage.getItem(`commit_${raffleContract}`);
      if (!stored) return null;
      
      // Validate stored value is a valid bigint
      const nonce = BigInt(stored);
      return nonce > 0n ? nonce : null;
    } catch (error) {
      // Clear corrupted data
      this.clearCommitData(raffleContract);
      return null;
    }
  }

  static clearCommitData(raffleContract: string): void {
    this.validateContractAddress(raffleContract);
    localStorage.removeItem(`commit_${raffleContract}`);
  }
}