import React, { useState } from 'react';

interface SimpleNFTImageProps {
  contractAddress: string;
  tokenId: string;
  className?: string;
}

export default function SimpleNFTImage({ contractAddress, tokenId, className = '' }: SimpleNFTImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Simple IPFS URL construction - most NFTs use this pattern
  const getImageUrl = () => {
    if (imageError) return '/placeholder-nft.svg';
    
    // Try common NFT image patterns
    const patterns = [
      `https://ipfs.io/ipfs/${contractAddress}/${tokenId}`,
      `https://ipfs.io/ipfs/${contractAddress}/${tokenId}.json`,
      `https://ipfs.io/ipfs/${contractAddress}/${tokenId}.png`
    ];
    
    // Return first pattern for now - can be enhanced later
    return patterns[0];
  };

  return (
    <div className={`${className} relative overflow-hidden rounded-xl bg-slate-900/50`}>
      <img
        src={imageError ? '/placeholder-nft.svg' : getImageUrl()}
        alt={`NFT #${tokenId}`}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="text-center text-slate-400">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">NFT #{tokenId}</div>
          </div>
        </div>
      )}
    </div>
  );
}