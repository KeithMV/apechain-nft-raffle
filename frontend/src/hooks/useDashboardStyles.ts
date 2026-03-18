import { useMemo } from 'react';

export interface DashboardStyles {
  // Container styles
  containerBorderColor: string;
  containerShadowColor: string;
  
  // Header styles
  headerBgGradient: string;
  headerBorderColor: string;
  titleGradient: string;
  
  // Grid and background
  gridColor: string;
  
  // Tab styles
  tabActiveStyle: string;
  tabHoverStyle: string;
  
  // Card styles
  cardBorderColor: string;
  cardShadowColor: string;
  cardBgGradient: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  
  // Button styles
  loadMoreButtonGradient: string;
  loadMoreButtonHover: string;
  loadMoreButtonShadow: string;
  loadMoreButtonShadowHover: string;
  
  // Animation styles
  shimmerGradient: string;
}

export function useDashboardStyles(isApeChain: boolean): DashboardStyles {
  return useMemo(() => {
    if (isApeChain) {
      return {
        // Container styles
        containerBorderColor: 'border-emerald-500/30',
        containerShadowColor: 'shadow-emerald-500/10',
        
        // Header styles
        headerBgGradient: 'from-emerald-900/20 via-green-900/20 to-teal-900/20',
        headerBorderColor: 'border-emerald-500/30',
        titleGradient: 'from-emerald-400 via-green-400 to-teal-400',
        
        // Grid and background
        gridColor: 'rgba(16,185,129,0.03)',
        
        // Tab styles
        tabActiveStyle: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50 shadow-emerald-500/25',
        tabHoverStyle: 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-500/10 hover:border-emerald-400/30',
        
        // Card styles
        cardBorderColor: 'border-emerald-500/30',
        cardShadowColor: 'shadow-emerald-500/10',
        cardBgGradient: 'from-emerald-500/5 via-teal-500/5 to-cyan-500/5',
        
        // Text colors
        textPrimary: 'text-emerald-300',
        textSecondary: 'text-emerald-400/70',
        
        // Button styles
        loadMoreButtonGradient: 'from-emerald-600 to-teal-600',
        loadMoreButtonHover: 'hover:from-emerald-500 hover:to-teal-500',
        loadMoreButtonShadow: 'shadow-emerald-500/25',
        loadMoreButtonShadowHover: 'hover:shadow-emerald-500/40',
        
        // Animation styles
        shimmerGradient: 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0',
      };
    } else {
      return {
        // Container styles
        containerBorderColor: 'border-blue-500/30',
        containerShadowColor: 'shadow-blue-500/10',
        
        // Header styles
        headerBgGradient: 'from-blue-900/20 via-indigo-900/20 to-purple-900/20',
        headerBorderColor: 'border-blue-500/30',
        titleGradient: 'from-blue-400 via-indigo-400 to-purple-400',
        
        // Grid and background
        gridColor: 'rgba(59,130,246,0.03)',
        
        // Tab styles
        tabActiveStyle: 'bg-blue-500/20 text-blue-200 border-blue-400/50 shadow-blue-500/25',
        tabHoverStyle: 'text-blue-300/70 hover:text-blue-200 hover:bg-blue-500/10 hover:border-blue-400/30',
        
        // Card styles
        cardBorderColor: 'border-blue-500/30',
        cardShadowColor: 'shadow-blue-500/10',
        cardBgGradient: 'from-blue-500/5 via-indigo-500/5 to-purple-500/5',
        
        // Text colors
        textPrimary: 'text-blue-300',
        textSecondary: 'text-blue-400/70',
        
        // Button styles
        loadMoreButtonGradient: 'from-blue-600 to-indigo-600',
        loadMoreButtonHover: 'hover:from-blue-500 hover:to-indigo-500',
        loadMoreButtonShadow: 'shadow-blue-500/25',
        loadMoreButtonShadowHover: 'hover:shadow-blue-500/40',
        
        // Animation styles
        shimmerGradient: 'from-blue-500/0 via-blue-500/20 to-blue-500/0',
      };
    }
  }, [isApeChain]);
}