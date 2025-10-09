import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { nftMetadataService } from '../services/nftMetadataService';

interface NFTImageProps {
  contractAddress: string;
  tokenId: string;
  className?: string;
  showName?: boolean;
}

export default function NFTImage({ contractAddress, tokenId, className = '', showName = false }: NFTImageProps) {
  const publicClient = usePublicClient();
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicClient) return;

    const loadMetadata = async () => {
      setLoading(true);
      setError(false);
      
      try {
        const data = await nftMetadataService.getNFTMetadata(publicClient, contractAddress, tokenId);
        setMetadata(data);
      } catch (err) {
        console.error('Failed to load NFT metadata:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [publicClient, contractAddress, tokenId]);

  if (loading) {
    return (
      <div className={`relative bg-gray-800/90 border border-emerald-500/30 rounded-lg flex items-center justify-center ${className} backdrop-blur-sm`}>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg blur-sm animate-pulse"></div>
        <div className="relative w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !metadata?.image) {
    return (
      <div className={`relative bg-gray-800/90 border border-emerald-500/30 rounded-lg flex flex-col items-center justify-center ${className} backdrop-blur-sm`}>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg blur-sm"></div>
        <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-xl flex items-center justify-center mb-3">
          <span className="text-emerald-400 text-2xl">🖼️</span>
        </div>
        <span className="text-emerald-300 text-sm font-medium text-center">NFT #{tokenId}</span>
        {showName && metadata?.name && <span className="text-emerald-200 text-xs mt-1 text-center">{metadata.name}</span>}
        <div className="mt-2 px-2 py-1 bg-emerald-500/10 border border-emerald-400/30 rounded text-emerald-400 text-xs">
          {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-emerald-500/30 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg blur-sm"></div>
      <img
        src={metadata.image}
        alt={metadata.name || `NFT #${tokenId}`}
        className="relative w-full h-full object-cover"
        onError={(e) => {
          console.error('Image failed to load:', metadata.image);
          setError(true);
        }}
      />
      {showName && metadata.name && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent p-2">
          <p className="text-emerald-200 text-sm truncate">{metadata.name}</p>
        </div>
      )}
    </div>
  );
}