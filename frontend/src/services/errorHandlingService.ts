/**
 * Centralized error handling for better user experience
 */

export class ErrorHandlingService {
  /**
   * Parse and format contract errors for user display
   */
  static parseContractError(error: any): string {
    const message = error?.message || error?.toString() || 'Unknown error';
    
    // Common contract errors
    if (message.includes('User rejected')) {
      return 'Transaction cancelled by user';
    }
    
    if (message.includes('insufficient funds')) {
      return 'Insufficient APE balance for this transaction';
    }
    
    if (message.includes('Not NFT owner')) {
      return 'You do not own this NFT';
    }
    
    if (message.includes('Raffle completed')) {
      return 'This raffle has already completed';
    }
    
    if (message.includes('Raffle expired')) {
      return 'This raffle has expired';
    }
    
    if (message.includes('Not enough tickets')) {
      return 'Not enough tickets available';
    }
    
    if (message.includes('Wrong payment')) {
      return 'Incorrect payment amount';
    }
    
    if (message.includes('execution reverted')) {
      return 'Transaction failed - please check your balance and try again';
    }
    
    if (message.includes('gas')) {
      return 'Transaction failed due to gas issues - please try again';
    }
    
    // Network errors
    if (message.includes('network')) {
      return 'Network error - please check your connection';
    }
    
    // Default fallback
    return 'Transaction failed - please try again';
  }

  /**
   * Check if error is user-cancelled
   */
  static isUserCancelled(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return message.includes('User rejected') || message.includes('user rejected');
  }

  /**
   * Check if error is due to insufficient funds
   */
  static isInsufficientFunds(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return message.includes('insufficient funds');
  }
}