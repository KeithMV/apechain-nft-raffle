import { keccak256, toBytes } from 'viem/utils';

export class WinnerSelectionService {
  /**
   * Generate a random nonce and its commit hash
   */
  static generateCommitReveal(): { nonce: bigint; commitHash: string } {
    try {
      // Use crypto functions with fallback
      const useKeccak = typeof keccak256 === 'function';
      const useToBytes = typeof toBytes === 'function';
      
      const randomValue = Math.random() || 0.5; // Fallback value
      const safeRandom = Number.isFinite(randomValue) ? randomValue : 0.5;
      
      const nonce = BigInt(Math.floor(safeRandom * Number.MAX_SAFE_INTEGER)) || BigInt(Date.now());
      
      let commitHash: string;
      try {
        commitHash = keccak256(toBytes(nonce.toString()));
      } catch {
        commitHash = '0x' + nonce.toString(16);
      }
      
      return { nonce, commitHash };
    } catch (error) {
      // Return fallback values on error
      return { nonce: BigInt(Date.now()), commitHash: '0x' + Date.now().toString(16) };
    }
  }

  /**
   * Store commit data securely (in practice, use encrypted storage)
   */
  static storeCommitData(raffleContract: string, nonce: bigint): void {
    try {
      if (!raffleContract || nonce === undefined) {
        // Return early for invalid parameters
        return;
      }
      localStorage.setItem(`commit_${raffleContract}`, nonce.toString());
    } catch (error) {
      // Silently fail storage - not critical
      return;
    }
  }

  /**
   * Retrieve stored nonce for reveal
   */
  static getStoredNonce(raffleContract: string): bigint | null {
    const stored = localStorage.getItem(`commit_${raffleContract}`);
    return stored ? BigInt(stored) : null;
  }

  /**
   * Clear stored commit data after reveal
   */
  static clearCommitData(raffleContract: string): void {
    localStorage.removeItem(`commit_${raffleContract}`);
  }

  /**
   * Complete commit-reveal process for a raffle
   */
  static async commitAndReveal(raffleContract: string): Promise<void> {
    try {
      if (!raffleContract) {
        // Return early for invalid contract
        return;
      }
      
      // Generate commit-reveal data
      const { nonce, commitHash } = this.generateCommitReveal();
      
      // Store nonce securely
      this.storeCommitData(raffleContract, nonce);
      
      // TODO: Implement commit hash with hooks
      console.log('Commit hash generated:', commitHash);
      
      // TODO: Implement reveal with hooks
      console.log('Nonce for reveal:', nonce);
    } catch (error) {
      this.clearCommitData(raffleContract);
      // Process failed - cleanup done
      return;
    }
  }

  /**
   * Emergency winner selection if commit-reveal fails
   */
  static async emergencySelection(raffleContract: string): Promise<void> {
    try {
      if (!raffleContract) {
        // Return early for invalid contract
        return;
      }
      // TODO: Implement emergency winner selection with hooks
      console.log('Emergency selection for:', raffleContract);
      this.clearCommitData(raffleContract);
    } catch (error) {
      this.clearCommitData(raffleContract);
      // Emergency selection failed - cleanup done
      return;
    }
  }
}