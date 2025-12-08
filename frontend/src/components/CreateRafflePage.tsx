import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { usePlatformFee, useNFTApprovalStatus, useNFTApproval, useCreateRaffle } from '../hooks/useRaffleContract';
import { NETWORK_CONFIG } from '../config/addresses';
import { useApeChainSwitching } from '../utils/chainSwitching';
import ApeTokenBalance from './ApeTokenBalance';
import MobileBanner from './MobileBanner';
import FeeDisplay from './FeeDisplay';
import toast from 'react-hot-toast';
import { 
  sanitizeAddress, 
  sanitizeTokenId, 
  sanitizeNumber, 
  ValidationRules, 
  validateInput,
  rateLimiter 
} from '../utils/inputSanitizer';

interface FormData {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: string;
  duration: string;
}

export default function CreateRafflePage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchToApeChain, isSwitching } = useApeChainSwitching();
  const [formData, setFormData] = useState<FormData>({
    nftContract: '',
    tokenId: '',
    ticketPrice: '0.1',
    maxTickets: '100',
    duration: '24'
  });
  
  const [loading, setLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<boolean | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const createRaffleInProgress = useRef(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  
  const isWrongNetwork = chainId !== 33139;
  // Professional wagmi hooks
  const { data: platformFeeData } = usePlatformFee();
  const { data: approvalData, refetch: refetchApproval } = useNFTApprovalStatus(
    formData.nftContract, 
    address || ''
  );
  const { 
    approveNFT, 
    isPending: approvalPending, 
    isConfirming: approvalConfirming, 
    isSuccess: approvalSuccess,
    error: approvalError 
  } = useNFTApproval();
  const {
    createRaffle,
    isPending: createPending,
    isConfirming: createConfirming,
    isSuccess: createSuccess,
    error: createError,
    reset: resetCreateRaffle
  } = useCreateRaffle();

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
      setApprovalLoading(false);
      setApprovalStatus(true);
      toast.success('NFT contract approved successfully!');
      refetchApproval();
    }
  }, [approvalSuccess, refetchApproval]);

  // Handle approval errors
  useEffect(() => {
    if (approvalError) {
      setApprovalLoading(false);
      console.error('❌ Approval failed:', approvalError);
      
      if (approvalError.message?.includes('User rejected')) {
        toast.error('Approval cancelled by user');
      } else if (approvalError.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction fees');
      } else {
        toast.error('Approval failed: ' + (approvalError.message || 'Unknown error'));
      }
    }
  }, [approvalError]);

  // Handle create raffle success
  useEffect(() => {
    if (createSuccess) {
      setLoading(false);
      createRaffleInProgress.current = false;
      
      toast.success('Raffle created successfully!');
      
      // Reset form
      setFormData({
        nftContract: '',
        tokenId: '',
        ticketPrice: '0.1',
        maxTickets: '100',
        duration: '24'
      });
      setApprovalStatus(null);
      
      // Reset state and re-enable button after brief delay
      setTimeout(() => {
        setButtonDisabled(false);
        console.log('✅ Ready for next raffle');
      }, 500);
    }
  }, [createSuccess]);

  // Handle create raffle errors
  useEffect(() => {
    if (createError) {
      setLoading(false);
      setButtonDisabled(false);
      createRaffleInProgress.current = false;
      console.error('Create raffle failed:', createError);
      
      if (createError.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (createError.message?.includes('Not NFT owner')) {
        toast.error('You do not own this NFT');
      } else if (createError.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else {
        toast.error('Failed to create raffle: ' + createError.message);
      }
    }
  }, [createError]);

  const handleApproval = async () => {
    if (!formData.nftContract) {
      toast.error('Please enter NFT contract address first');
      return;
    }

    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.nftContract)) {
      toast.error('Invalid contract address format');
      return;
    }

    setApprovalLoading(true);
    console.log('🔄 Approving NFT contract for raffle:', formData.nftContract);
    
    try {
      // Use professional wagmi hook with proper async handling
      await approveNFT(formData.nftContract);
      console.log('✅ NFT approval transaction initiated successfully');
    } catch (error: any) {
      console.error('Approval failed:', error);
      setApprovalLoading(false);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Approval cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction fees');
      } else {
        toast.error('Failed to approve NFT: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleCreateRaffle = React.useCallback(async () => {
    // Aggressive debouncing - prevent any rapid clicks
    if (loading || createPending || createConfirming || createRaffleInProgress.current || buttonDisabled) {
      console.log('🚫 Create raffle blocked - already in progress:', { loading, createPending, createConfirming, inProgress: createRaffleInProgress.current, buttonDisabled });
      return;
    }
    
    // Light debounce check to prevent accidental double-clicks only
    const now = Date.now();
    const lastAttempt = (window as any).__lastRaffleAttempt || 0;
    if (now - lastAttempt < 500) { // 0.5 second minimum - just prevent double-clicks
      console.log('🚫 Create raffle blocked - preventing double-click');
      return;
    }
    (window as any).__lastRaffleAttempt = now;
    
    // Set all protection flags immediately
    setLoading(true);
    setButtonDisabled(true);
    createRaffleInProgress.current = true;
    
    // Check network first
    if (isWrongNetwork) {
      setLoading(false);
      setButtonDisabled(false);
      createRaffleInProgress.current = false;
      toast.error('Please switch to ApeChain network');
      try {
        await switchToApeChain();
        return;
      } catch (error) {
        toast.error('Failed to switch network');
        return;
      }
    }

    // Rate limiting check
    if (!rateLimiter.isAllowed('createRaffle', 5, 300000)) { // 5 attempts per 5 minutes
      setLoading(false);
      setButtonDisabled(false);
      createRaffleInProgress.current = false;
      toast.error('Too many attempts. Please wait before creating another raffle.');
      return;
    }

    // Comprehensive input validation
    const validationErrors: string[] = [];
    
    const addressValidation = validateInput(formData.nftContract, ValidationRules.address);
    if (!addressValidation.isValid) {
      validationErrors.push(`NFT Contract: ${addressValidation.error}`);
    }
    
    const tokenIdValidation = validateInput(formData.tokenId, ValidationRules.tokenId);
    if (!tokenIdValidation.isValid) {
      validationErrors.push(`Token ID: ${tokenIdValidation.error}`);
    }
    
    const priceValidation = validateInput(formData.ticketPrice, ValidationRules.ticketPrice);
    if (!priceValidation.isValid) {
      validationErrors.push(`Ticket Price: ${priceValidation.error}`);
    }
    
    const ticketsValidation = validateInput(formData.maxTickets, ValidationRules.maxTickets);
    if (!ticketsValidation.isValid) {
      validationErrors.push(`Max Tickets: ${ticketsValidation.error}`);
    }
    
    const durationValidation = validateInput(formData.duration, ValidationRules.duration);
    if (!durationValidation.isValid) {
      validationErrors.push(`Duration: ${durationValidation.error}`);
    }

    if (validationErrors.length > 0) {
      setLoading(false);
      setButtonDisabled(false);
      createRaffleInProgress.current = false;
      toast.error(`Validation errors: ${validationErrors.join(', ')}`);
      return;
    }

    if (approvalStatus !== true) {
      setLoading(false);
      setButtonDisabled(false);
      createRaffleInProgress.current = false;
      toast.error('Please approve the NFT contract first');
      return;
    }

    // Parse validated inputs
    const maxTickets = parseInt(formData.maxTickets);
    const ticketPrice = parseFloat(formData.ticketPrice);
    const duration = parseInt(formData.duration);

    console.log('🎯 Creating raffle with params:', { nftContract: formData.nftContract, tokenId: formData.tokenId, ticketPrice, maxTickets, duration });
    try {
      // Convert hours to seconds (contract expects duration in seconds)
      const durationInSeconds = duration * 3600; // Convert hours to seconds
      
      console.log('🔍 Duration conversion debug:', {
        inputHours: duration,
        calculatedSeconds: durationInSeconds,
        expectedEndTime: 'current_time + ' + durationInSeconds
      });
      
      // Use professional wagmi hook with proper async handling
      await createRaffle({
        nftContract: formData.nftContract,
        tokenId: formData.tokenId,
        ticketPrice: formData.ticketPrice,
        maxTickets: maxTickets,
        duration: durationInSeconds
      });
      
      console.log('✅ Create raffle transaction initiated successfully');
      
    } catch (error: any) {
      console.error('Create raffle failed:', error);
      
      // Handle specific error types
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else {
        toast.error('Failed to create raffle: ' + (error.message || 'Unknown error'));
      }
      
      setLoading(false);
      setButtonDisabled(false);
      createRaffleInProgress.current = false;
    }
  }, [loading, createPending, createConfirming, isWrongNetwork, switchToApeChain, formData, approvalStatus]); // Removed createRaffle to prevent callback recreation

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

  const totalRevenue = (parseFloat(formData.ticketPrice || '0') * parseInt(formData.maxTickets || '0')).toFixed(2);
  const platformFeeAmount = (parseFloat(totalRevenue) * parseFloat(platformFee) / 100).toFixed(2);
  const creatorRevenue = (parseFloat(totalRevenue) - parseFloat(platformFeeAmount)).toFixed(2);

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border border-emerald-400/30 rounded-3xl shadow-2xl shadow-emerald-500/20 overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      
      <div className="relative bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-4 sm:px-8 py-6 sm:py-8 border-b border-emerald-400/30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-sm animate-pulse"></div>
            <span className="relative text-slate-900 text-xl sm:text-2xl font-bold">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-sans tracking-tight">Create NFT Raffle</h2>
            <p className="text-slate-300 mt-1 text-sm sm:text-base font-medium">Launch your NFT into the raffle ecosystem</p>
          </div>
        </div>
      </div>

      <div className="relative p-4 sm:p-8 z-10">
        {/* Connected Wallet Info */}
        <div className="relative bg-slate-800/80 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-2xl"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <p className="text-slate-200 text-sm mb-1 font-medium">
                <span className="font-semibold text-emerald-300">Connected Wallet:</span> 
                <span className="ml-2 text-slate-300 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </p>
              <p className="text-slate-400 text-xs font-medium">
                <span className="font-semibold">Network:</span> {NETWORK_CONFIG.name} • Chain ID: {NETWORK_CONFIG.chainId}
              </p>
            </div>
            <FeeDisplay className="text-emerald-300 text-sm" />
          </div>
        </div>

        {/* Network Warning */}
        {isWrongNetwork && (
          <div className="relative bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center text-red-300">
              <span className="mr-2">⚠️</span>
              <div>
                <p className="font-semibold">Wrong Network Detected</p>
                <p className="text-sm text-red-400">Please switch to ApeChain (Chain ID: 33139) to create raffles</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Wallet Guidance */}
        <MobileBanner />

        {/* APE Token Balance */}
        <div className="mb-6">
          <ApeTokenBalance />
        </div>

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
                className="w-full bg-slate-800/80 border border-emerald-400/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-mono backdrop-blur-sm shadow-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Token ID *
              </label>
              <input
                type="text"
                value={formData.tokenId}
                onChange={(e) => handleInputChange('tokenId', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123"
                className="w-full bg-slate-800/80 border border-emerald-400/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-mono backdrop-blur-sm shadow-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2 font-mono tracking-wider">
                Ticket Price (APE) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.ticketPrice}
                onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                placeholder="0.1"
                className="w-full bg-gray-800/90 border border-pink-500/30 rounded-lg px-4 py-3 text-pink-100 placeholder-pink-400/50 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-colors font-mono backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2 font-mono tracking-wider">
                Max Tickets *
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.maxTickets}
                onChange={(e) => handleInputChange('maxTickets', e.target.value)}
                placeholder="100"
                className="w-full bg-gray-800/90 border border-pink-500/30 rounded-lg px-4 py-3 text-pink-100 placeholder-pink-400/50 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-colors font-mono backdrop-blur-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-pink-200 mb-2 font-mono tracking-wider">
                Duration *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full bg-gray-800/90 border border-pink-500/30 rounded-lg px-4 py-3 text-pink-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-colors font-mono backdrop-blur-sm"
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

        {/* Revenue Summary with Professional Fee Display */}
        <div className="relative bg-gradient-to-r from-pink-900/20 via-fuchsia-900/20 to-purple-900/20 border border-pink-500/30 rounded-xl p-4 sm:p-6 mt-6 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-fuchsia-500/5 to-purple-500/5 rounded-xl blur-sm animate-pulse"></div>
          <h4 className="relative font-semibold text-pink-200 mb-3 sm:mb-4 flex items-center text-sm sm:text-base font-mono tracking-wider">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-pink-500/20 rounded-lg flex items-center justify-center mr-2">
              <span className="text-pink-400 text-xs">⚡</span>
            </div>
            Revenue Projection (Full Capacity)
          </h4>
          
          <div className="relative mb-4">
            <FeeDisplay 
              totalAmount={parseFloat(totalRevenue) || 0}
              showBreakdown={true}
              className="bg-gray-800/60 border border-pink-500/20 rounded-lg p-3 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Approval Section */}
        {formData.nftContract && (
          <div className="relative bg-gray-800/90 backdrop-blur-xl border border-pink-500/30 rounded-xl p-4 sm:p-6 mt-6 shadow-lg shadow-pink-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-fuchsia-500/5 to-purple-500/5 rounded-xl blur-sm animate-pulse"></div>
            <h4 className="relative font-semibold text-pink-200 mb-3 flex items-center text-sm sm:text-base font-mono tracking-wider">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-pink-500/20 rounded-lg flex items-center justify-center mr-2">
                <span className="text-pink-400 text-xs">⚡</span>
              </div>
              NFT Approval Status
            </h4>
            
            {approvalStatus === null ? (
              <div className="relative flex items-center text-pink-300/70 text-sm font-mono">
                <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                Checking approval status...
              </div>
            ) : approvalStatus ? (
              <div className="relative flex items-center text-pink-300 text-sm font-mono tracking-wide">
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
                    className="relative bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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
            disabled={buttonDisabled || createPending || createConfirming || isSwitching || loading || (!isWrongNetwork && (!formData.nftContract || !formData.tokenId || approvalStatus !== true))}
            className="relative flex-1 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:via-fuchsia-500 hover:to-purple-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/40 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            {isSwitching ? (
              <span className="relative flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm sm:text-base">Switching Network...</span>
              </span>
            ) : createPending || createConfirming || loading ? (
              <span className="relative flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm sm:text-base">{createConfirming ? 'Confirming...' : 'Creating raffle...'}</span>
              </span>
            ) : isWrongNetwork ? (
              <span className="relative">Switch to ApeChain</span>
            ) : approvalStatus !== true ? (
              <span className="relative">NFT Approval Required</span>
            ) : (
              <span className="relative">Create NFT Raffle</span>
            )}
          </button>
        </div>
        
        {/* Approval Education Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-emerald-400/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">🛡️</span>
                  NFT Approval Explained
                </h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="text-green-300 font-medium mb-2">✅ What This Approval Does:</div>
                  <ul className="text-green-200 text-xs space-y-1">
                    <li>• Allows raffle system to transfer your NFT when you create a raffle</li>
                    <li>• Only affects NFTs from this specific contract: <span className="font-mono break-all">{formData.nftContract.slice(0, 10)}...{formData.nftContract.slice(-8)}</span></li>
                    <li>• Standard, secure NFT marketplace approval</li>
                  </ul>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="text-red-300 font-medium mb-2">❌ What This Approval Does NOT Do:</div>
                  <ul className="text-red-200 text-xs space-y-1">
                    <li>• Cannot access your APE tokens or other cryptocurrencies</li>
                    <li>• Cannot access NFTs from other contracts</li>
                    <li>• Cannot transfer anything without your explicit action</li>
                    <li>• Cannot be used by anyone except the raffle system</li>
                  </ul>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-blue-300 font-medium mb-2">🔒 Your Control:</div>
                  <ul className="text-blue-200 text-xs space-y-1">
                    <li>• You can revoke this approval anytime</li>
                    <li>• Only you can create raffles with your NFTs</li>
                    <li>• Same approval system used by OpenSea, Blur, etc.</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    handleApproval();
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white py-2 px-4 rounded-lg font-medium transition-all"
                >
                  I Understand - Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}