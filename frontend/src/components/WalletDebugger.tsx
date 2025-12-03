import React from 'react';
import { useConnectors } from 'wagmi';

export default function WalletDebugger() {
  const connectors = useConnectors();

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-sm z-50">
      <h3 className="text-white font-semibold mb-2">🔍 Wallet Debug Info</h3>
      <div className="text-xs text-slate-300 space-y-1">
        <div>Total Connectors: {connectors.length}</div>
        {connectors.map((connector, index) => (
          <div key={index} className="border-t border-slate-700 pt-1">
            <div>ID: {connector.id}</div>
            <div>Name: {connector.name}</div>
            <div>Type: {connector.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}