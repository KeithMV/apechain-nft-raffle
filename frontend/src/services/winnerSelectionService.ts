import { keccak256, toBytes } from 'viem';
import { raffleContractService } from './raffleContractService';

export class WinnerSelectionService {
  /**
   * Generate a random nonce and its commit hash
   */
  static generateCommitReveal(): { nonce: bigint; commitHash: string } {
    const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    const commitHash = keccak256(toBytes(nonce.toString()));
    return { nonce, commitHash };
  }

  /**
   * Store commit data securely (in practice, use encrypted storage)
   */
  static storeCommitData(raffleContract: string, nonce: bigint): void {
    localStorage.setItem(`commit_${raffleContract}`, nonce.toString());
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
    // Generate commit-reveal data
    const { nonce, commitHash } = this.generateCommitReveal();
    
    // Store nonce securely
    this.storeCommitData(raffleContract, nonce);
    
    // Commit hash
    await raffleContractService.commitRandomness(raffleContract, commitHash);
    
    // Wait a bit then reveal (in production, this should be done after the commit phase)
    setTimeout(async () => {
      try {
        await raffleContractService.revealAndSelectWinner(raffleContract, nonce);
        this.clearCommitData(raffleContract);
      } catch (error) {
        console.error('Reveal failed:', error);
      }
    }, 5000); // 5 second delay for demo
  }

  /**
   * Emergency winner selection if commit-reveal fails
   */
  static async emergencySelection(raffleContract: string): Promise<void> {
    await raffleContractService.emergencySelectWinner(raffleContract);
    this.clearCommitData(raffleContract);
  }
}