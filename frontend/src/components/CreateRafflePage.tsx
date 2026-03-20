import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { usePlatformFeeV4, useCreateRaffleV4 } from '../hooks/useRaffleContractV4';
import { useNFTApprovalManager } from '../hooks/useNFTApprovalManager';
import { useApeChainSwitching } from '../utils/chainSwitching';
import { useNetwork } from '../contexts/NetworkContext';
import { useUserNFTs } from '../hooks/useUserNFTs';
import ApprovalModal from './ApprovalModal';
import NFTGrid from './NFTGrid';
import RaffleForm, { FormData, getInitialFormData, validateAddress } from './RaffleForm';

import toast from 'react-hot-toast';
import { ErrorHandler } from '../utils/errorHandler';
// Phase 10: Performance Implementation
import { debounce, performanceMonitor, measureAsync } from '../utils/performance';
import { sanitizeAddress } from '../utils/security';

// Pure function moved outside component
const calculateDurationInSeconds = (hours: string): number => {
  return parseInt(hours) * 3600;
};

export default function CreateRafflePage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();
  const { theme, nativeCurrency, networkName, isApeChain, isPolygon } = useNetwork();
  const { switchToApeChain, isSwitching } = useApeChainSwitching();
  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  
  // Fetch user's NFTs
  const { nfts, loading: nftsLoading } = useUserNFTs(address || '', chainId || 0);
  
  // Use the new approval manager
  const {
    approvalStatus,
    isCheckingApproval,
    currentContract,
    approvalPending,
    approvalConfirming,
    approvalSuccess,
    approvalError,
    checkApprovalForContract,
    approveContract,
    clearApprovalState
  } = useNFTApprovalManager();
  
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  const isWrongNetwork = !isApeChain && !isPolygon;
  // Professional wagmi V4 hooks
  const { data: platformFeeData } = usePlatformFeeV4();
  const {
    createRaffle,
    isPending: createPending,
    isConfirming: createConfirming,
    isSuccess: createSuccess,
    error: createError
  } = useCreateRaffleV4();

  const platformFee = platformFeeData ? (Number(platformFeeData) / 100).toString() : '5';

  // Handle approval errors
  useEffect(() => {
    if (approvalError) {
      ErrorHandler.handleWalletError(approvalError);
    }
  }, [approvalError]);
  
  // Check approval when contract changes - Phase 10: Debounced validation
  const debouncedCheckApproval = useCallback(
    debounce((contract: string) => {
      if (contract && validateAddress(contract)) {
        measureAsync('approval-check', () => 
          checkApprovalForContract(sanitizeAddress(contract))
        );
      }
    }, 500),
    [checkApprovalForContract]
  );

  useEffect(() => {
    if (formData.nftContract) {
      debouncedCheckApproval(formData.nftContract);
    }
  }, [formData.nftContract, debouncedCheckApproval]);

  // Handle create raffle success - show success state and redirect
  useEffect(() => {
    if (createSuccess) {
      // Show success message
      toast.success('🎉 Raffle created successfully! Redirecting to browse raffles...');
      
      // Reset form and clear approval state after a short delay
      setTimeout(() => {
        setFormData(getInitialFormData());
        clearApprovalState();
        
        // Navigate to browse raffles page
        navigate('/browse');
      }, 2000);
    }
  }, [createSuccess, navigate, clearApprovalState]);

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
      () => approveContract(formData.nftContract),
      ErrorHandler.handleWalletError
    );
  };

  const handleCreateRaffle = async () => {
    if (createPending || createConfirming) return;
    
    // Phase 10: Performance monitoring for raffle creation
    const endTiming = performanceMonitor.startTiming('raffle-creation');
    
    try {
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
          nftContract: sanitizeAddress(formData.nftContract),
          tokenId: formData.tokenId,
          ticketPrice: formData.ticketPrice,
          maxTickets: parseInt(formData.maxTickets),
          duration: durationInSeconds
        }),
        ErrorHandler.handleContractError
      );
    } finally {
      endTiming();
    }
  };



  const handleNFTSelect = useCallback((nft: { contractAddress: string; tokenId: string }) => {
    setFormData(prev => ({
      ...prev,
      nftContract: nft.contractAddress,
      tokenId: nft.tokenId
    }));
    // Approval will be checked automatically via useEffect
  }, []);

  const handleFormChange = useCallback((newFormData: FormData) => {
    setFormData(prevData => {
      // Only update if contract actually changed (avoid deep comparison)
      if (newFormData.nftContract !== prevData.nftContract ||
          newFormData.tokenId !== prevData.tokenId ||
          newFormData.ticketPrice !== prevData.ticketPrice ||
          newFormData.maxTickets !== prevData.maxTickets ||
          newFormData.duration !== prevData.duration) {
        return newFormData;
      }
      return prevData;
    });
  }, []);



  const containerBorderColor = isApeChain ? 'border-emerald-400/30' : 'border-purple-400/30';
  const containerShadowColor = isApeChain ? 'shadow-emerald-500/20' : 'shadow-purple-500/20';
  const headerBgGradient = isApeChain 
    ? 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10' 
    : 'from-purple-500/10 via-violet-500/10 to-indigo-500/10';
  const headerBorderColor = isApeChain ? 'border-emerald-400/30' : 'border-purple-400/30';
  const titleGradient = isApeChain 
    ? 'from-emerald-400 via-teal-300 to-cyan-400' 
    : 'from-purple-400 via-violet-300 to-indigo-400';
  const patternColor = isApeChain ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.1)';
  const gridColor = isApeChain ? 'rgba(16,185,129,0.05)' : 'rgba(168,85,247,0.05)';

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

        {/* Raffle Form */}
        <RaffleForm
          formData={formData}
          onFormChange={handleFormChange}
          isApeChain={isApeChain}
          nativeCurrency={nativeCurrency}
          disabled={createPending || createConfirming || isSwitching}
        />



        {/* Approval Section */}
        {formData.nftContract && (
          <div className={`relative bg-gray-800/90 backdrop-blur-xl border ${isApeChain ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-purple-500/30 shadow-purple-500/10'} rounded-xl p-4 sm:p-6 mt-6 shadow-lg`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${isApeChain ? 'from-emerald-500/5 via-teal-500/5 to-cyan-500/5' : 'from-purple-500/5 via-violet-500/5 to-indigo-500/5'} rounded-xl blur-sm animate-pulse`}></div>
            <h4 className={`relative font-semibold ${isApeChain ? 'text-emerald-200' : 'text-purple-200'} mb-3 flex items-center text-sm sm:text-base font-mono tracking-wider`}>
              <div className={`w-4 h-4 sm:w-5 sm:h-5 ${isApeChain ? 'bg-emerald-500/20' : 'bg-purple-500/20'} rounded-lg flex items-center justify-center mr-2`}>
                <span className={`${isApeChain ? 'text-emerald-400' : 'text-purple-400'} text-xs`}>⚡</span>
              </div>
              NFT Contract Approval Status
              {currentContract && (
                <span className="text-xs opacity-75 ml-2">(Contract: {currentContract.slice(0, 6)}...{currentContract.slice(-4)})</span>
              )}
            </h4>
            
            {approvalStatus === null || isCheckingApproval ? (
              <div className={`relative flex items-center ${isApeChain ? 'text-emerald-300/70' : 'text-purple-300/70'} text-sm font-mono`}>
                <div className={`w-4 h-4 border-2 ${isApeChain ? 'border-emerald-400' : 'border-purple-400'} border-t-transparent rounded-full animate-spin mr-2`}></div>
                Checking approval status...
              </div>
            ) : approvalStatus ? (
              <div className={`relative flex items-center ${isApeChain ? 'text-emerald-300' : 'text-purple-300'} text-sm font-mono tracking-wide`}>
                <span className="mr-2">✅</span>
                Contract Approved • All NFTs from this contract can be used in raffles
              </div>
            ) : (
              <div className="relative space-y-3">
                <div className="flex items-center text-yellow-400 text-sm font-mono tracking-wide">
                  <span className="mr-2">⚠️</span>
                  Contract Approval Required • One-time approval for this NFT contract
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    disabled={approvalPending || approvalConfirming}
                    className={`relative bg-gradient-to-r ${isApeChain ? 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' : 'from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500'} text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${isApeChain ? 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0' : 'from-purple-500/0 via-purple-500/20 to-purple-500/0'} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                    {approvalPending || approvalConfirming ? (
                      <span className="relative flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {approvalConfirming ? 'Confirming...' : 'Approving contract...'}
                      </span>
                    ) : (
                      <span className="relative">Approve NFT Contract</span>
                    )}
                  </button>
                  
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="text-purple-300 text-xs font-medium mb-1">🛡️ Contract-Level Approval</div>
                    <div className="text-purple-200 text-xs">
                      This approval allows the raffle system to transfer ANY NFT from this contract when you create raffles. Once approved, you can use any NFT from this contract without re-approving.
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
            className={`relative flex-1 bg-gradient-to-r ${isApeChain ? 'from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 shadow-emerald-500/25 hover:shadow-emerald-500/40' : 'from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 shadow-purple-500/25 hover:shadow-purple-500/40'} text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group`}
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