import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { SimpleImageProxy } from '../services/SimpleImageProxy';

interface PolygonNFTDebuggerProps {
  contractAddress: string;
  tokenId: string;
}

export default function PolygonNFTDebugger({ contractAddress, tokenId }: PolygonNFTDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const publicClient = usePublicClient();

  const debugNFT = async () => {
    if (!publicClient || !contractAddress || !tokenId) return;
    
    setLoading(true);
    const info: any = {
      contractAddress,
      tokenId,
      chainId: publicClient.chain?.id,
      chainName: publicClient.chain?.name,
      steps: []
    };

    try {
      // Step 1: Get tokenURI from contract
      info.steps.push('🔍 Getting tokenURI from contract...');
      const tokenURI = await publicClient.readContract({
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

      info.tokenURI = tokenURI;
      info.steps.push(`✅ TokenURI: ${tokenURI}`);

      // Step 2: Convert IPFS URL if needed
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsPath = tokenURI.slice(7);
        metadataUrl = `https://ipfs.io/ipfs/${ipfsPath}`;
        info.steps.push(`🔄 Converted IPFS URL: ${metadataUrl}`);
      }

      // Step 3: Test Lambda proxy
      const lambdaProxy = process.env.REACT_APP_ENV === 'staging' 
        ? 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/staging/proxy'
        : 'https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy';
      
      const proxiedUrl = `${lambdaProxy}?url=${encodeURIComponent(metadataUrl)}`;
      info.steps.push(`🌐 Testing Lambda proxy: ${proxiedUrl}`);

      try {
        const response = await fetch(proxiedUrl, {
          signal: AbortSignal.timeout(10000),
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const metadata = await response.json();
          info.metadata = metadata;
          info.steps.push(`✅ Metadata fetched successfully`);
          info.steps.push(`📷 Image URL: ${metadata.image}`);

          // Step 4: Test image URLs
          if (metadata.image) {
            const imageUrls = SimpleImageProxy.getFallbackUrls(metadata.image);
            info.imageUrls = imageUrls;
            info.steps.push(`🔗 Generated ${imageUrls.length} fallback URLs`);

            // Test first few image URLs
            for (let i = 0; i < Math.min(3, imageUrls.length); i++) {
              const url = imageUrls[i];
              try {
                const testResult = await SimpleImageProxy.testImageUrl(url);
                info.steps.push(`${testResult.success ? '✅' : '❌'} URL ${i + 1}: ${testResult.success ? 'OK' : testResult.error}`);
              } catch (error) {
                info.steps.push(`❌ URL ${i + 1}: Test failed - ${error}`);
              }
            }
          }
        } else {
          info.steps.push(`❌ Lambda proxy failed: ${response.status} ${response.statusText}`);
        }
      } catch (proxyError) {
        info.steps.push(`❌ Lambda proxy error: ${proxyError}`);
      }

      // Step 5: Test direct metadata URL
      info.steps.push(`🔄 Testing direct metadata URL...`);
      try {
        const directResponse = await fetch(metadataUrl, {
          signal: AbortSignal.timeout(10000),
          headers: { 'Accept': 'application/json' }
        });
        
        if (directResponse.ok) {
          const directMetadata = await directResponse.json();
          info.directMetadata = directMetadata;
          info.steps.push(`✅ Direct metadata fetch successful`);
        } else {
          info.steps.push(`❌ Direct metadata failed: ${directResponse.status}`);
        }
      } catch (directError) {
        info.steps.push(`❌ Direct metadata error: ${directError}`);
      }

    } catch (error) {
      info.steps.push(`❌ Contract read failed: ${error}`);
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    if (contractAddress && tokenId) {
      debugNFT();
    }
  }, [contractAddress, tokenId, publicClient]);

  return (
    <div className="bg-slate-800 p-4 rounded-lg text-sm font-mono">
      <h3 className="text-emerald-400 font-bold mb-4">🔍 Polygon NFT Debug Info</h3>
      
      <div className="space-y-2">
        <div><span className="text-blue-400">Contract:</span> {debugInfo.contractAddress}</div>
        <div><span className="text-blue-400">Token ID:</span> {debugInfo.tokenId}</div>
        <div><span className="text-blue-400">Chain:</span> {debugInfo.chainName} ({debugInfo.chainId})</div>
      </div>

      {loading && (
        <div className="mt-4 text-yellow-400">🔄 Debugging in progress...</div>
      )}

      {debugInfo.steps && debugInfo.steps.length > 0 && (
        <div className="mt-4">
          <h4 className="text-emerald-400 font-bold mb-2">Debug Steps:</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {debugInfo.steps.map((step: string, index: number) => (
              <div key={index} className="text-gray-300">{step}</div>
            ))}
          </div>
        </div>
      )}

      {debugInfo.metadata && (
        <div className="mt-4">
          <h4 className="text-emerald-400 font-bold mb-2">Metadata:</h4>
          <pre className="text-xs text-gray-300 bg-slate-900 p-2 rounded overflow-x-auto">
            {JSON.stringify(debugInfo.metadata, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo.imageUrls && (
        <div className="mt-4">
          <h4 className="text-emerald-400 font-bold mb-2">Image Fallback URLs:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {debugInfo.imageUrls.map((url: string, index: number) => (
              <div key={index} className="text-xs text-gray-400 break-all">
                {index + 1}. {url}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={debugNFT}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded"
      >
        {loading ? 'Debugging...' : 'Re-run Debug'}
      </button>
    </div>
  );
}