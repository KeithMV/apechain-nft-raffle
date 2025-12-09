import React, { useState } from 'react';

export default function GasEstimationWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div className="flex items-start space-x-3">
        <span className="text-yellow-400 text-xl">⚠️</span>
        <div className="flex-1">
          <div className="text-yellow-300 font-medium mb-1">Gas Estimation Notice</div>
          <div className="text-yellow-200 text-sm mb-2">
            MetaMask may show inflated gas fees (like $2.3M) due to ApeChain RPC issues. 
            <strong className="text-yellow-100"> Actual transaction costs are normal (~$0.002)</strong>.
          </div>
          <div className="text-yellow-300 text-xs">
            ✅ Transactions work correctly • ✅ Real gas costs are tiny • ⚠️ Only estimation is broken
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-400 hover:text-yellow-300 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}