// Simple winner selection service - removed complex validation and error handling
export class WinnerSelectionService {
  static generateCommitReveal(): { nonce: bigint; commitHash: string } {
    const nonce = BigInt(Math.floor(Math.random() * 1000000));
    const commitHash = `0x${nonce.toString(16).padStart(64, '0')}`;
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