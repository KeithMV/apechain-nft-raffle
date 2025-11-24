/**
 * NFT Metadata Hook
 * Professional wagmi hook for NFT metadata fetching
 */

import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  imageAlternatives?: string[];
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export function useNFTMetadata(contractAddress: string, tokenId: string) {
  const publicClient = usePublicClient();
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicClient || !contractAddress || !tokenId) return;

    const loadMetadata = async () => {
      setLoading(true);
      setError(false);
      
      try {
        console.log(`Loading NFT metadata for ${contractAddress} #${tokenId}`);
        
        // Try to get tokenURI from contract
        let tokenURI: string;
        try {
          tokenURI = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: [
              {
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                name: 'tokenURI',
                outputs: [{ name: '', type: 'string' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            functionName: 'tokenURI',
            args: [BigInt(tokenId)],
          });
        } catch (err) {
          console.error('Failed to get tokenURI:', err);
          throw new Error('Failed to get token URI');
        }

        if (!tokenURI) {
          throw new Error('No token URI found');
        }

        // Handle IPFS URLs
        let metadataUrl = tokenURI;
        if (tokenURI.startsWith('ipfs://')) {
          metadataUrl = `https://ipfs.io/ipfs/${tokenURI.slice(7)}`;
        }

        // Fetch metadata
        const response = await fetch(metadataUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Process image URL
        let imageUrl = data.image;
        const imageAlternatives: string[] = [];
        
        if (imageUrl) {
          if (imageUrl.startsWith('ipfs://')) {
            const ipfsHash = imageUrl.slice(7);
            imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
            
            // Add alternative IPFS gateways
            imageAlternatives.push(
              `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
              `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
              `https://dweb.link/ipfs/${ipfsHash}`
            );
          }
        }

        const processedMetadata: NFTMetadata = {
          name: data.name,
          description: data.description,
          image: imageUrl,
          imageAlternatives,
          attributes: data.attributes,
        };

        console.log('NFT metadata loaded:', processedMetadata);
        setMetadata(processedMetadata);
      } catch (err) {
        console.error(`Failed to load NFT metadata for ${contractAddress} #${tokenId}:`, err);
        setError(true);
        
        // Set fallback metadata
        setMetadata({
          name: `NFT #${tokenId}`,
          image: '/placeholder-nft.svg',
        });
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [publicClient, contractAddress, tokenId]);

  return { metadata, loading, error };
}