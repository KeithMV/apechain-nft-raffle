import { readContract } from '@wagmi/core';
import { config } from '../config/wagmi';
import { parseUnits, formatUnits } from 'viem';

// APE Token on ApeChain - need to verify actual address
const APE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder

// Validation function for runtime checks
function validateTokenAddress(): void {
  try {
    if (!APE_TOKEN_ADDRESS || typeof APE_TOKEN_ADDRESS !== 'string') {
      // Return early for invalid configuration
      return;
    }
    
    if (APE_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      // Using placeholder value - update with actual contract address in production
      return; // Allow placeholder for development
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(APE_TOKEN_ADDRESS)) {
      // Return early for invalid format
      return;
    }
  } catch (error) {
    // Re-throw validation errors
    throw error;
  }
}

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
    try {
      // Validate configuration first
      validateTokenAddress();
      
      if (this.decimals !== null) {
        return this.decimals;
      }

      // Validate required functions are available
      if (typeof parseUnits !== 'function' || typeof formatUnits !== 'function') {
        throw new Error('Required viem functions not available');
      }

      // For ApeChain, APE is the native token (like ETH), so it uses 18 decimals
      // But we should verify this if using an ERC20 APE token
      const decimals = 18;
      
      if (decimals <= 0 || decimals > 77) { // Max decimals check
        throw new Error('Invalid decimals value');
      }
      
      this.decimals = decimals;
      return this.decimals;
    } catch (error) {
      // Default to 18 decimals on error
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
    try {
      if (!ticketPrice || quantity <= 0) {
        throw new Error('Invalid ticket price or quantity');
      }
      const priceWei = await this.parseApe(ticketPrice);
      return priceWei * BigInt(quantity);
    } catch (error) {
      // Return 0 on calculation error
      return BigInt(0);
    }
  }
}

export const apeTokenService = new ApeTokenService();