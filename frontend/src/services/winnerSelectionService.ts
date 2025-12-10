import { keccak256, toBytes } from 'viem/utils';

export class WinnerSelectionService {
  static generateCommitReveal(): { nonce: bigint; commitHash: string } {
    const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    const commitHash = keccak256(toBytes(nonce.toString()));
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
}