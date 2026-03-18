import React from 'react';

export interface RaffleFiltersProps {
  showExpired: boolean;
  setShowExpired: (show: boolean) => void;
  activeCount: number;
  expiredCount: number;
  totalRaffles: number;
  isApeChain: boolean;
}

const RaffleFilters: React.FC<RaffleFiltersProps> = ({
  showExpired,
  setShowExpired,
  activeCount,
  expiredCount,
  totalRaffles,
  isApeChain
}) => {
  // Memoize styles based on network
  const activeButtonStyle = isApeChain
    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
    : 'bg-blue-500/20 text-blue-300 border border-blue-400/30';

  const toggleExpired = () => setShowExpired(!showExpired);

  if (totalRaffles === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header Filter Toggle */}
      <div className="flex items-center justify-end">
        <button
          onClick={toggleExpired}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showExpired 
              ? activeButtonStyle
              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50'
          }`}
        >
          {showExpired ? 'Hide Expired' : 'Show Expired'}
        </button>
      </div>

      {/* Stats Display */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl px-4 py-2">
          <span className="text-emerald-300 font-medium">{activeCount} Active</span>
        </div>
        <button
          onClick={toggleExpired}
          className="bg-slate-700/50 border border-slate-600/30 hover:bg-slate-600/50 hover:border-slate-500/50 rounded-xl px-4 py-2 transition-all cursor-pointer"
        >
          <span className="text-slate-400 hover:text-slate-300 font-medium">{expiredCount} Expired</span>
        </button>
      </div>
    </div>
  );
};

export default RaffleFilters;