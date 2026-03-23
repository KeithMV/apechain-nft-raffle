import React, { useState } from 'react';
import { PolygonNFTDebugger } from '../components';
import { useAccount, useChainId } from 'wagmi';

// Common Polygon NFT contracts for testing
const POLYGON_TEST_NFTS = [
  {
    name: 'Aavegotchi',
    contract: '0x86935F11C86623deC8a25696E1C19a8659CbF95d',
    tokenId: '1'
  },
  {
    name: 'OpenSea Shared Storefront',
    contract: '0x2953399124F0cBB46d2CbACD8A89cF0599974963',
    tokenId: '1'
  },
  {
    name: 'Decentraland Wearables',
    contract: '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
    tokenId: '1'
  },
  {
    name: 'Polygon Apes',
    contract: '0x2953399124F0cBB46d2CbACD8A89cF0599974963',
    tokenId: '2'
  }
];

export default function PolygonNFTTestPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedNFT, setSelectedNFT] = useState(POLYGON_TEST_NFTS[0]);
  const [customContract, setCustomContract] = useState('');
  const [customTokenId, setCustomTokenId] = useState('');

  const isPolygon = chainId === 137;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-400 mb-8">
          🔍 Polygon NFT Image Debug Tool
        </h1>

        {!address && (
          <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-6">
            <p className="text-yellow-200">
              ⚠️ Please connect your wallet to test NFT image loading
            </p>
          </div>
        )}

        {address && !isPolygon && (
          <div className="bg-orange-900/50 border border-orange-600 rounded-lg p-4 mb-6">
            <p className="text-orange-200">
              🔄 Please switch to Polygon network (Chain ID: 137) to test Polygon NFTs
            </p>
            <p className="text-sm text-orange-300 mt-2">
              Current chain: {chainId}
            </p>
          </div>
        )}

        {address && isPolygon && (
          <div className="bg-emerald-900/50 border border-emerald-600 rounded-lg p-4 mb-6">
            <p className="text-emerald-200">
              ✅ Connected to Polygon network - Ready to test NFT images
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-emerald-400 mb-4">Test Controls</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Test NFT:
                  </label>
                  <select
                    value={POLYGON_TEST_NFTS.findIndex(nft => nft.contract === selectedNFT.contract && nft.tokenId === selectedNFT.tokenId)}
                    onChange={(e) => setSelectedNFT(POLYGON_TEST_NFTS[parseInt(e.target.value)])}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  >
                    {POLYGON_TEST_NFTS.map((nft, index) => (
                      <option key={index} value={index}>
                        {nft.name} (#{nft.tokenId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-slate-600 pt-4">
                  <h3 className="text-lg font-medium text-gray-300 mb-3">Custom NFT Test</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Contract Address:
                      </label>
                      <input
                        type="text"
                        value={customContract}
                        onChange={(e) => setCustomContract(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Token ID:
                      </label>
                      <input
                        type="text"
                        value={customTokenId}
                        onChange={(e) => setCustomTokenId(e.target.value)}
                        placeholder="1"
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      />
                    </div>
                    
                    <button
                      onClick={() => {
                        if (customContract && customTokenId) {
                          setSelectedNFT({
                            name: 'Custom NFT',
                            contract: customContract,
                            tokenId: customTokenId
                          });
                        }
                      }}
                      disabled={!customContract || !customTokenId}
                      className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded"
                    >
                      Test Custom NFT
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-emerald-400 mb-4">Current Test NFT</h2>
              <div className="space-y-2 text-sm">
                <div><span className="text-blue-400">Name:</span> {selectedNFT.name}</div>
                <div><span className="text-blue-400">Contract:</span> {selectedNFT.contract}</div>
                <div><span className="text-blue-400">Token ID:</span> {selectedNFT.tokenId}</div>
              </div>
            </div>
          </div>

          {/* Debug Output */}
          <div>
            {address && selectedNFT.contract && selectedNFT.tokenId && (
              <PolygonNFTDebugger
                contractAddress={selectedNFT.contract}
                tokenId={selectedNFT.tokenId}
              />
            )}
          </div>
        </div>

        <div className="mt-8 bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">Common Issues & Solutions</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-yellow-400">❌ Images not loading:</h3>
              <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                <li>Check if tokenURI returns valid metadata URL</li>
                <li>Verify Lambda proxy is accessible</li>
                <li>Test if IPFS gateways are responding</li>
                <li>Check for CORS issues with direct URLs</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-yellow-400">❌ Metadata fetch fails:</h3>
              <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                <li>Contract might not implement ERC-721 tokenURI</li>
                <li>Token might not exist or be burned</li>
                <li>Metadata URL might be invalid or unreachable</li>
                <li>Lambda proxy might be down or misconfigured</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-green-400">✅ Expected behavior:</h3>
              <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                <li>TokenURI should return valid metadata URL</li>
                <li>Lambda proxy should successfully fetch metadata</li>
                <li>Image URLs should be accessible through fallback system</li>
                <li>Debug info should show successful steps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}