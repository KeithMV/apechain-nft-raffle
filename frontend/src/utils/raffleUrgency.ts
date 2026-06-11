/**
 * Raffle Urgency Utilities
 * Calculate time remaining and urgency level for raffles
 */

export interface UrgencyInfo {
  timeRemaining: string;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  badge: string;
  color: string;
}

/**
 * Calculate time remaining and urgency level
 */
export function getRaffleUrgency(endTime: number): UrgencyInfo {
  const now = Date.now() / 1000;
  const timeLeft = endTime - now;
  
  // Convert to hours
  const hoursLeft = timeLeft / 3600;
  
  // Determine urgency level and badge
  if (hoursLeft < 0) {
    return {
      timeRemaining: 'Ended',
      urgencyLevel: 'low',
      badge: 'ENDED',
      color: 'bg-slate-600 text-slate-300'
    };
  } else if (hoursLeft < 2) {
    const minutesLeft = Math.floor((timeLeft % 3600) / 60);
    return {
      timeRemaining: `${Math.floor(hoursLeft)}h ${minutesLeft}m`,
      urgencyLevel: 'critical',
      badge: `🔥 ENDING IN ${Math.floor(hoursLeft)}H ${minutesLeft}M`,
      color: 'bg-red-600 text-white animate-pulse'
    };
  } else if (hoursLeft < 24) {
    return {
      timeRemaining: `${Math.floor(hoursLeft)}h`,
      urgencyLevel: 'high',
      badge: `⏰ ${Math.floor(hoursLeft)} HOURS LEFT`,
      color: 'bg-orange-600 text-white'
    };
  } else if (hoursLeft < 72) {
    const daysLeft = Math.floor(hoursLeft / 24);
    return {
      timeRemaining: `${daysLeft}d`,
      urgencyLevel: 'medium',
      badge: `📅 ${daysLeft} DAY${daysLeft > 1 ? 'S' : ''} LEFT`,
      color: 'bg-yellow-600 text-white'
    };
  } else {
    const daysLeft = Math.floor(hoursLeft / 24);
    return {
      timeRemaining: `${daysLeft}d`,
      urgencyLevel: 'low',
      badge: `${daysLeft} DAYS`,
      color: 'bg-slate-700 text-slate-300'
    };
  }
}

/**
 * Get sold out urgency badge
 */
export function getSoldOutBadge(ticketsSold: number, maxTickets: number): { badge: string; color: string } | null {
  const percentSold = (ticketsSold / maxTickets) * 100;
  
  if (ticketsSold >= maxTickets) {
    return {
      badge: '🎯 SOLD OUT',
      color: 'bg-red-600 text-white'
    };
  } else if (percentSold >= 90) {
    return {
      badge: `🎯 ${Math.floor(percentSold)}% SOLD`,
      color: 'bg-orange-600 text-white'
    };
  } else if (percentSold >= 75) {
    return {
      badge: `${Math.floor(percentSold)}% SOLD`,
      color: 'bg-yellow-600 text-white'
    };
  }
  
  return null;
}
