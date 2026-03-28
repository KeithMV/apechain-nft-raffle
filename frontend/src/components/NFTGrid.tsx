import React from 'react';
import BasicNFTImage from './BasicNFTImage';

interface UserNFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  image?: string;
}

interface NFTGridProps {
  nfts: UserNFT[];
  onSelect: (nft: UserNFT) => void;
  isApeChain?: boolean;
  loading?: boolean;
}

export default function NFTGrid({ nfts, onSelect, isApeChain = false, loading = false }: NFTGridProps) {
  const borderColor = isApeChain ? 'border-emerald-400/30' : 'border-blue-400/30';
  const hoverBorder = isApeChain ? 'hover:border-emerald-400' : 'hover:border-blue-400';
  const shadowColor = isApeChain ? 'hover:shadow-emerald-500/20' : 'hover:shadow-blue-500/20';

  if (loading) {
    return (
      <div className={`bg-slate-800/50 border ${borderColor} rounded-xl p-6 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-200 font-semibold text-lg">
            Your NFT Collection
          </h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${isApeChain ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
            Loading...
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className={`w-8 h-8 border-2 ${isApeChain ? 'border-emerald-400' : 'border-blue-400'} border-t-transparent rounded-full animate-spin mx-auto mb-3`}></div>
            <p className="text-slate-400 text-sm">Discovering your NFTs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className={`bg-slate-800/50 border ${borderColor} rounded-xl p-6 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-200 font-semibold text-lg">
            Your NFT Collection
          </h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${isApeChain ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
            0 NFTs
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-slate-300 font-medium mb-2">No NFTs Found</p>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            We couldn't find any NFTs in your wallet on this network. You can still create a raffle by entering the contract address manually below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 border ${borderColor} rounded-xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-200 font-semibold text-lg">
          Your NFT Collection
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${isApeChain ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
          {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <p className="text-slate-400 text-sm mb-4">
        Click any NFT below to automatically fill the raffle form:
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {nfts.map((nft) => (
          <button
            key={`${nft.contractAddress}-${nft.tokenId}`}
            onClick={() => onSelect(nft)}
            className={`group relative border-2 ${borderColor} ${hoverBorder} rounded-xl p-3 transition-all duration-200 ${shadowColor} hover:shadow-lg transform hover:scale-105 bg-slate-900/50 hover:bg-slate-800/70`}
          >
            <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-slate-700/50 relative">
              <BasicNFTImage
                contractAddress={nft.contractAddress}
                tokenId={nft.tokenId}
                size="lg"
                className="w-full h-full"
              />
              {/* Fallback for NFTs without images */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs bg-slate-800/50 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                <div className="text-center">
                  <div>NFT #{nft.tokenId}</div>
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <div className="text-slate-200 font-medium text-sm mb-1 truncate">
                {nft.name || `NFT #${nft.tokenId}`}
              </div>
              <div className="text-slate-400 text-xs truncate">
                #{nft.tokenId}
              </div>
            </div>
            
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${isApeChain ? 'from-emerald-500/20 to-transparent' : 'from-blue-500/20 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center`}>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${isApeChain ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                Select for Raffle
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {nfts.length >= 20 && (
        <div className="mt-4 text-center">
          <p className="text-slate-400 text-xs">
            Showing first {nfts.length} NFTs. More may be available in your wallet.
          </p>
        </div>
      )}
    </div>
  );
}