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
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-lg blur-sm animate-pulse"></div>
        <div className="relative flex flex-col items-center">
          <span className="text-emerald-400 text-2xl mb-2">⚡</span>
          <span className="text-emerald-300/70 text-xs text-center font-mono tracking-wider">NFT #{tokenId}</span>
          {showName && (
            <span className="text-emerald-200 text-sm mt-1 text-center font-mono">
              {metadata?.name || `NFT #${tokenId}`}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-emerald-500/30 ${className}`}>
      <img
        src={metadata.image}
        alt={metadata.name || `NFT #${tokenId}`}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
      {showName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 via-gray-800/50 to-transparent p-2 border-t border-emerald-500/20">
          <p className="text-emerald-200 text-sm font-medium truncate font-mono tracking-wide">
            {metadata.name || `NFT #${tokenId}`}
          </p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>
    </div>
  );
}