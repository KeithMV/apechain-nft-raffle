import { readContract } from '@wagmi/core';
import { config } from '../config/wagmi-minimal';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI } from '../config/contracts';

/**
 * Professional Fee Management Service
 * Handles dynamic fee display and business logic
 */

export interface FeeTier {
  name: string;
  basisPoints: number;
  percentage: number;
  description: string;
  useCase: string;
}

export const FEE_TIERS: Record<string, FeeTier> = {
  PROMOTIONAL: {
    name: 'Promotional',
    basisPoints: 100,
    percentage: 1,
    description: 'Launch Special',
    useCase: 'Market penetration, high-value NFTs'
  },
  COMPETITIVE: {
    name: 'Competitive',
    basisPoints: 500,
    percentage: 5,
    description: 'Market Rate',
    useCase: 'Standard operations, competitive positioning'
  },
  STANDARD: {
    name: 'Standard',
    basisPoints: 1000,
    percentage: 10,
    description: 'Platform Standard',
    useCase: 'Balanced revenue and adoption'
  },
  PREMIUM: {
    name: 'Premium',
    basisPoints: 2000,
    percentage: 20,
    description: 'Exclusive Events',
    useCase: 'Special collections, maximum revenue'
  }
};

class FeeManagementService {
  
  /**
   * Get current platform fee from contract
   */
  async getCurrentPlatformFee(): Promise<{
    basisPoints: number;
    percentage: number;
    tier: FeeTier | null;
  }> {
    try {
      const fee = await readContract(config, {
        address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'platformFee',
      });

      const basisPoints = Number(fee);
      const percentage = basisPoints / 100;
      
      // Find matching tier
      const tier = Object.values(FEE_TIERS).find(t => t.basisPoints === basisPoints) || null;

      return {
        basisPoints,
        percentage,
        tier
      };
    } catch (error) {
      console.error('Failed to get platform fee:', error);
      // Return fallback
      return {
        basisPoints: 500,
        percentage: 5,
        tier: FEE_TIERS.COMPETITIVE
      };
    }
  }

  /**
   * Calculate fee amount for a given total
   */
  calculateFeeAmount(totalAmount: number, basisPoints: number): {
    feeAmount: number;
    creatorAmount: number;
    feePercentage: number;
  } {
    const feeAmount = (totalAmount * basisPoints) / 10000;
    const creatorAmount = totalAmount - feeAmount;
    const feePercentage = basisPoints / 100;

    return {
      feeAmount,
      creatorAmount,
      feePercentage
    };
  }

  /**
   * Get fee tier by basis points
   */
  getTierByBasisPoints(basisPoints: number): FeeTier | null {
    return Object.values(FEE_TIERS).find(tier => tier.basisPoints === basisPoints) || null;
  }

  /**
   * Get all available fee tiers
   */
  getAllTiers(): FeeTier[] {
    return Object.values(FEE_TIERS);
  }

  /**
   * Get business recommendation based on platform metrics
   */
  getBusinessRecommendation(metrics: {
    totalRaffles: number;
    monthsActive: number;
    averageTicketPrice: number;
  }): {
    recommendedTier: FeeTier;
    reasoning: string;
  } {
    const { totalRaffles, monthsActive, averageTicketPrice } = metrics;

    // Launch phase (0-3 months or <50 raffles)
    if (monthsActive < 3 || totalRaffles < 50) {
      return {
        recommendedTier: FEE_TIERS.PROMOTIONAL,
        reasoning: 'Launch phase: Focus on user acquisition and market penetration'
      };
    }

    // Growth phase (3-12 months or 50-500 raffles)
    if (monthsActive < 12 || totalRaffles < 500) {
      return {
        recommendedTier: FEE_TIERS.COMPETITIVE,
        reasoning: 'Growth phase: Balance competitiveness with sustainable revenue'
      };
    }

    // High-value collections
    if (averageTicketPrice > 10) {
      return {
        recommendedTier: FEE_TIERS.PREMIUM,
        reasoning: 'High-value NFTs: Premium positioning justified by collection quality'
      };
    }

    // Mature phase
    return {
      recommendedTier: FEE_TIERS.STANDARD,
      reasoning: 'Mature platform: Optimize for revenue with established user base'
    };
  }

  /**
   * Format fee display for UI
   */
  formatFeeDisplay(basisPoints: number): {
    percentage: string;
    description: string;
    badge: 'promotional' | 'competitive' | 'standard' | 'premium';
  } {
    const tier = this.getTierByBasisPoints(basisPoints);
    const percentage = (basisPoints / 100).toFixed(1) + '%';

    if (!tier) {
      return {
        percentage,
        description: 'Custom Rate',
        badge: 'standard'
      };
    }

    const badgeMap: Record<string, 'promotional' | 'competitive' | 'standard' | 'premium'> = {
      'Promotional': 'promotional',
      'Competitive': 'competitive',
      'Standard': 'standard',
      'Premium': 'premium'
    };

    return {
      percentage,
      description: tier.description,
      badge: badgeMap[tier.name] || 'standard'
    };
  }

  /**
   * Get competitive analysis
   */
  getCompetitiveAnalysis(): {
    platform: string;
    fee: string;
    comparison: string;
  }[] {
    return [
      {
        platform: 'OpenSea',
        fee: '2.5%',
        comparison: 'Industry standard for secondary sales'
      },
      {
        platform: 'SuperRare',
        fee: '15%',
        comparison: 'Premium art platform'
      },
      {
        platform: 'Foundation',
        fee: '15%',
        comparison: 'Curated art marketplace'
      },
      {
        platform: 'Rarible',
        fee: '2.5%',
        comparison: 'Community-owned marketplace'
      }
    ];
  }
}

export const feeManagementService = new FeeManagementService();