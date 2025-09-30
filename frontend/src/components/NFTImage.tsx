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
      <div className={`bg-slate-700/50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !metadata?.image) {
    return (
      <div className={`bg-slate-700/50 rounded-lg flex flex-col items-center justify-center ${className}`}>
        <span className="text-slate-400 text-2xl mb-2">🖼️</span>
        <span className="text-slate-400 text-xs text-center">NFT #{tokenId}</span>
        {showName && (
          <span className="text-slate-300 text-sm mt-1 text-center">
            {metadata?.name || `Token #${tokenId}`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <img
        src={metadata.image}
        alt={metadata.name || `NFT #${tokenId}`}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
      {showName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-white text-sm font-medium truncate">
            {metadata.name || `Token #${tokenId}`}
          </p>
        </div>
      )}
    </div>
  );
}