import { readContract } from '@wagmi/core';
import { wagmiConfig } from '../config/wagmi';
import { parseUnits, formatUnits } from 'viem';

// APE Token on ApeChain - need to verify actual address
const APE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder

const ERC20_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

class ApeTokenService {
  private decimals: number | null = null;

  /**
   * Get APE token decimals (cached)
   */
  async getDecimals(): Promise<number> {
    if (this.decimals !== null) {
      return this.decimals;
    }

    try {
      // For ApeChain, APE is the native token (like ETH), so it uses 18 decimals
      // But we should verify this if using an ERC20 APE token
      this.decimals = 18;
      return this.decimals;
    } catch (error) {
      console.warn('Could not get APE decimals, defaulting to 18:', error);
      this.decimals = 18;
      return this.decimals;
    }
  }

  /**
   * Parse APE amount to wei (with correct decimals)
   */
  async parseApe(amount: string): Promise<bigint> {
    const decimals = await this.getDecimals();
    return parseUnits(amount, decimals);
  }

  /**
   * Format wei to APE amount (with correct decimals)
   */
  async formatApe(wei: bigint): Promise<string> {
    const decimals = await this.getDecimals();
    return formatUnits(wei, decimals);
  }

  /**
   * Calculate total cost for multiple tickets
   */
  async calculateTotalCost(ticketPrice: string, quantity: number): Promise<bigint> {
    const priceWei = await this.parseApe(ticketPrice);
    return priceWei * BigInt(quantity);
  }
}

export const apeTokenService = new ApeTokenService();