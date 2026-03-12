import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { usePlatformFeeV4, useNFTApprovalStatusV4, useNFTApprovalV4, useCreateRaffleV4 } from '../hooks/useRaffleContractV4';
import { useApeChainSwitching } from '../utils/chainSwitching';
import { useNetwork } from '../contexts/NetworkContext';
import { useUserNFTs } from '../hooks/useUserNFTs';
import ApprovalModal from './ApprovalModal';
import NFTGrid from './NFTGrid';

import toast from 'react-hot-toast';
import { 
  sanitizeAddress, 
  sanitizeTokenId, 
  sanitizeNumber
} from '../utils/inputSanitizer';
import { ErrorHandler } from '../utils/errorHandler';

interface FormData {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: string;
  duration: string;
}

// Pure functions moved outside component
const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const calculateDurationInSeconds = (hours: string): number => {
  return parseInt(hours) * 3600;
};

const getInitialFormData = (): FormData => ({
  nftContract: '',
  tokenId: '',
  ticketPrice: '0.1',
  maxTickets: '100',
  duration: '24'
});

export default function CreateRafflePage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();
  const { theme, nativeCurrency, networkName, isApeChain, isPolygon } = useNetwork();
  const { switchToApeChain, isSwitching } = useApeChainSwitching();
  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  
  // Fetch user's NFTs
  const { nfts, loading: nftsLoading } = useUserNFTs(address || '', chainId || 0);
  
  const [approvalStatus, setApprovalStatus] = useState<boolean | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  const isWrongNetwork = !isApeChain && !isPolygon;
  // Professional wagmi V4 hooks
  const { data: platformFeeData } = usePlatformFeeV4();
  const { data: approvalData, refetch: refetchApproval } = useNFTApprovalStatusV4(
    formData.nftContract, 
    address || ''
  );
  const { 
    approveNFT, 
    isPending: approvalPending, 
    isConfirming: approvalConfirming, 
    isSuccess: approvalSuccess,
    error: approvalError
  } = useNFTApprovalV4();
  const {
    createRaffle,
    isPending: createPending,
    isConfirming: createConfirming,
    isSuccess: createSuccess,
    error: createError
  } = useCreateRaffleV4();

  const platformFee = platformFeeData ? (Number(platformFeeData) / 100).toString() : '5';

  // Update approval status from hook data
  useEffect(() => {
    if (approvalData !== undefined) {
      setApprovalStatus(approvalData as boolean);
    }
  }, [approvalData]);

  // Handle approval success
  useEffect(() => {
    if (approvalSuccess) {
      setApprovalStatus(true);
      toast.success('NFT contract approved successfully!');
      refetchApproval();
    }
  }, [approvalSuccess, refetchApproval]);

  // Handle approval errors
  useEffect(() => {
    if (approvalError) {
      ErrorHandler.handleWalletError(approvalError);
    }
  }, [approvalError]);

  // Handle create raffle success - show success state and redirect
  useEffect(() => {
    if (createSuccess) {
      // Show success message
      toast.success('🎉 Raffle created successfully! Redirecting to browse raffles...');
      
      // Reset form after a short delay
      setTimeout(() => {
        setFormData(getInitialFormData());
        setApprovalStatus(null);
        
        // Navigate to browse raffles page
        navigate('/browse');
      }, 2000);
    }
  }, [createSuccess]);

  // Handle create raffle errors
  useEffect(() => {
    if (createError) {
      ErrorHandler.handleContractError(createError);
    }
  }, [createError]);

  const handleApproval = async () => {
    if (!formData.nftContract || !validateAddress(formData.nftContract)) {
      ErrorHandler.handleValidationError('NFT contract address', formData.nftContract);
      return;
    }

    await ErrorHandler.withErrorHandling(
      () => approveNFT(formData.nftContract),
      ErrorHandler.handleWalletError
    );
  };

  const handleCreateRaffle = async () => {
    if (createPending || createConfirming) return;
    
    if (isWrongNetwork) {
      ErrorHandler.handleValidationError('network', 'Wrong network - please switch to ApeChain');
      return;
    }

    if (approvalStatus !== true) {
      ErrorHandler.handleValidationError('NFT approval', 'Contract not approved');
      return;
    }

    // Validate form data
    if (!formData.nftContract || !formData.tokenId || !formData.ticketPrice || !formData.maxTickets) {
      ErrorHandler.handleValidationError('form data', 'All fields are required');
      return;
    }

    const durationInSeconds = calculateDurationInSeconds(formData.duration);
    
    await ErrorHandler.withErrorHandling(
      () => createRaffle({
        nftContract: formData.nftContract,
        tokenId: formData.tokenId,
        ticketPrice: formData.ticketPrice,
        maxTickets: parseInt(formData.maxTickets),
        duration: durationInSeconds
      }),
      ErrorHandler.handleContractError
    );
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let sanitizedValue = value;
    
    // Apply field-specific sanitization
    switch (field) {
      case 'nftContract':
        sanitizedValue = sanitizeAddress(value);
        break;
      case 'tokenId':
        sanitizedValue = sanitizeTokenId(value);
        break;
      case 'ticketPrice':
        sanitizedValue = sanitizeNumber(value, 0.001, 1000000);
        break;
      case 'maxTickets':
        sanitizedValue = sanitizeNumber(value, 1, 10000);
        break;
      case 'duration':
        sanitizedValue = value; // Dropdown, already controlled
        break;
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleNFTSelect = (nft: { contractAddress: string; tokenId: string }) => {
    setFormData(prev => ({
      ...prev,
      nftContract: nft.contractAddress,
      tokenId: nft.tokenId
    }));
    // Reset approval status when NFT changes
    setApprovalStatus(null);
  };



  const containerBorderColor = isApeChain ? 'border-emerald-400/30' : 'border-blue-400/30';
  const containerShadowColor = isApeChain ? 'shadow-emerald-500/20' : 'shadow-blue-500/20';
  const headerBgGradient = isApeChain 
    ? 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10' 
    : 'from-blue-500/10 via-indigo-500/10 to-purple-500/10';
  const headerBorderColor = isApeChain ? 'border-emerald-400/30' : 'border-blue-400/30';
  const titleGradient = isApeChain 
    ? 'from-emerald-400 via-teal-300 to-cyan-400' 
    : 'from-blue-400 via-indigo-300 to-purple-400';
  const patternColor = isApeChain ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)';
  const gridColor = isApeChain ? 'rgba(16,185,129,0.05)' : 'rgba(59,130,246,0.05)';

  return (
    <div className={`relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border ${containerBorderColor} rounded-3xl shadow-2xl ${containerShadowColor} overflow-hidden`}>

      <div className="absolute inset-0 animate-pulse" style={{
        background: `radial-gradient(circle_at_50%_50%, ${patternColor}, transparent_50%)`
      }}></div>
      <div className="absolute inset-0 bg-[size:30px_30px]" style={{
        backgroundImage: `linear-gradient(45deg, ${gridColor} 1px, transparent 1px), linear-gradient(-45deg, ${gridColor} 1px, transparent 1px)`
      }}></div>
      
      <div className={`relative bg-gradient-to-r ${headerBgGradient} px-4 sm:px-8 py-6 sm:py-8 border-b ${headerBorderColor}`}>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent font-sans tracking-tight`}>Create NFT Raffle</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-4 sm:p-8 z-10">
        {/* Network Warning */}
        {isWrongNetwork && (
          <div className="relative bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center text-red-300">
              <span className="mr-2">⚠️</span>
              <div>
                <p className="font-semibold">Wrong Network Detected</p>
                <p className="text-sm text-red-400">Please switch to {networkName} to create raffles</p>
              </div>
            </div>
          </div>
        )}







        {/* NFT Wallet Display */}
        {address && !isWrongNetwork && (
          <NFTGrid 
            nfts={nfts} 
            onSelect={handleNFTSelect}
            isApeChain={isApeChain}
            loading={nftsLoading}
          />
        )}

        {/* NFT Details Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                NFT Contract Address *
              </label>
              <input
                type="text"
                value={formData.nftContract}
                onChange={(e) => handleInputChange('nftContract', e.target.value)}
                placeholder="0x..."
                className={`w-full bg-slate-800/80 border ${isApeChain ? 'border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-blue-400/30 focus:border-blue-400 focus:ring-blue-400/20'} rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:ring-2 transition-all font-mono backdrop-blur-sm shadow-lg`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Token ID *
              </label>
              <input
                type="text"
                value={formData.tokenId}
                onChange={(e) => handleInputChange('tokenId', e.target.value)}
                placeholder="123"
                className={`w-full bg-slate-800/80 border ${isApeChain ? 'border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-blue-400/30 focus:border-blue-400 focus:ring-blue-400/20'} rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:ring-2 transition-all font-mono backdrop-blur-sm shadow-lg`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium ${isApeChain ? 'text-emerald-200' : 'text-blue-200'} mb-2 font-mono tracking-wider`}>
                Ticket Price ({nativeCurrency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.ticketPrice}
                onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                placeholder="0.1"
                className={`w-full bg-gray-800/90 border ${isApeChain ? 'border-emerald-500/30 focus:border-emerald-400 focus:ring-emerald-400' : 'border-blue-500/30 focus:border-blue-400 focus:ring-blue-400'} rounded-lg px-4 py-3 ${isApeChain ? 'text-emerald-100 placeholder-emerald-400/50' : 'text-blue-100 placeholder-blue-400/50'} focus:ring-1 transition-colors font-mono backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${isApeChain ? 'text-emerald-200' : 'text-blue-200'} mb-2 font-mono tracking-wider`}>
                Max Tickets *
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.maxTickets}
                onChange={(e) => handleInputChange('maxTickets', e.target.value)}
                placeholder="100"
                className={`w-full bg-gray-800/90 border ${isApeChain ? 'border-emerald-500/30 focus:border-emerald-400 focus:ring-emerald-400' : 'border-blue-500/30 focus:border-blue-400 focus:ring-blue-400'} rounded-lg px-4 py-3 ${isApeChain ? 'text-emerald-100 placeholder-emerald-400/50' : 'text-blue-100 placeholder-blue-400/50'} focus:ring-1 transition-colors font-mono backdrop-blur-sm`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${isApeChain ? 'text-emerald-200' : 'text-blue-200'} mb-2 font-mono tracking-wider`}>
                Duration *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className={`w-full bg-gray-800/90 border ${isApeChain ? 'border-emerald-500/30 focus:border-emerald-400 focus:ring-emerald-400' : 'border-blue-500/30 focus:border-blue-400 focus:ring-blue-400'} rounded-lg px-4 py-3 ${isApeChain ? 'text-emerald-100' : 'text-blue-100'} focus:ring-1 transition-colors font-mono backdrop-blur-sm`}
              >
                <option value="1">1 HOUR</option>
                <option value="6">6 HOURS</option>
                <option value="12">12 HOURS</option>
                <option value="24">24 HOURS</option>
                <option value="48">48 HOURS</option>
                <option value="72">72 HOURS</option>
                <option value="168">1 WEEK</option>
              </select>
            </div>
          </div>
        </div>



        {/* Approval Section */}
        {formData.nftContract && (
          <div className={`relative bg-gray-800/90 backdrop-blur-xl border ${isApeChain ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-blue-500/30 shadow-blue-500/10'} rounded-xl p-4 sm:p-6 mt-6 shadow-lg`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${isApeChain ? 'from-emerald-500/5 via-teal-500/5 to-cyan-500/5' : 'from-blue-500/5 via-indigo-500/5 to-purple-500/5'} rounded-xl blur-sm animate-pulse`}></div>
            <h4 className={`relative font-semibold ${isApeChain ? 'text-emerald-200' : 'text-blue-200'} mb-3 flex items-center text-sm sm:text-base font-mono tracking-wider`}>
              <div className={`w-4 h-4 sm:w-5 sm:h-5 ${isApeChain ? 'bg-emerald-500/20' : 'bg-blue-500/20'} rounded-lg flex items-center justify-center mr-2`}>
                <span className={`${isApeChain ? 'text-emerald-400' : 'text-blue-400'} text-xs`}>⚡</span>
              </div>
              NFT Approval Status
            </h4>
            
            {approvalStatus === null ? (
              <div className={`relative flex items-center ${isApeChain ? 'text-emerald-300/70' : 'text-blue-300/70'} text-sm font-mono`}>
                <div className={`w-4 h-4 border-2 ${isApeChain ? 'border-emerald-400' : 'border-blue-400'} border-t-transparent rounded-full animate-spin mr-2`}></div>
                Checking approval status...
              </div>
            ) : approvalStatus ? (
              <div className={`relative flex items-center ${isApeChain ? 'text-emerald-300' : 'text-blue-300'} text-sm font-mono tracking-wide`}>
                <span className="mr-2">✅</span>
                NFT Contract Approved • Ready to create raffle
              </div>
            ) : (
              <div className="relative space-y-3">
                <div className="flex items-center text-yellow-400 text-sm font-mono tracking-wide">
                  <span className="mr-2">⚠️</span>
                  Approval Required • Please approve NFT contract
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    disabled={approvalPending || approvalConfirming}
                    className={`relative bg-gradient-to-r ${isApeChain ? 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' : 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'} text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${isApeChain ? 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0' : 'from-blue-500/0 via-blue-500/20 to-blue-500/0'} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                    {approvalPending || approvalConfirming ? (
                      <span className="relative flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {approvalConfirming ? 'Confirming...' : 'Approving contract...'}
                      </span>
                    ) : (
                      <span className="relative">Approve NFT Contract</span>
                    )}
                  </button>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-blue-300 text-xs font-medium mb-1">🛡️ Safe & Secure</div>
                    <div className="text-blue-200 text-xs">
                      This only allows the raffle system to transfer NFTs from this specific contract when you create a raffle. Your other assets remain protected.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Raffle Button */}
        <div className="relative flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleCreateRaffle}
            disabled={createPending || createConfirming || isSwitching || (!isWrongNetwork && (!formData.nftContract || !formData.tokenId || approvalStatus !== true))}
            className={`relative flex-1 bg-gradient-to-r ${isApeChain ? 'from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 shadow-emerald-500/25 hover:shadow-emerald-500/40' : 'from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-blue-500/25 hover:shadow-blue-500/40'} text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${isApeChain ? 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0' : 'from-blue-500/0 via-blue-500/20 to-blue-500/0'} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
            {isSwitching ? (
              <span className="relative flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm sm:text-base">Switching Network...</span>
              </span>
            ) : createPending || createConfirming ? (
              <span className="relative flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm sm:text-base">{createConfirming ? 'Confirming...' : 'Creating raffle...'}</span>
              </span>
            ) : isWrongNetwork ? (
              <span className="relative">Switch to {networkName}</span>
            ) : approvalStatus !== true ? (
              <span className="relative">NFT Approval Required</span>
            ) : (
              <span className="relative">Create NFT Raffle</span>
            )}
          </button>
        </div>
        
        {/* Approval Education Modal */}
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApproval}
          nftContract={formData.nftContract}
          nativeCurrency={nativeCurrency}
          isApeChain={isApeChain}
        />
      </div>
    </div>
  );
}