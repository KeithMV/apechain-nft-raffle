import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { raffleService } from '../services/raffleService';
import { NETWORK_CONFIG } from '../config/addresses';
import ApeTokenBalance from './ApeTokenBalance';
import toast from 'react-hot-toast';

interface FormData {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: string;
  duration: string;
}

export default function CreateRafflePage() {
  const { address } = useAccount();
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
  const [platformFee, setPlatformFee] = useState<string>('10');

  useEffect(() => {
    fetchPlatformFee();
  }, []);

  useEffect(() => {
    if (formData.nftContract && address) {
      checkApprovalStatus();
    }
  }, [formData.nftContract, address]);

  const fetchPlatformFee = async () => {
    try {
      const fee = await raffleService.getPlatformFee();
      setPlatformFee((Number(fee) / 100).toString()); // Convert basis points to percentage
    } catch (error) {
      console.error('Failed to fetch platform fee:', error);
    }
  };

  const checkApprovalStatus = async () => {
    if (!formData.nftContract || !address) return;
    
    try {
      const isApproved = await raffleService.isApprovedForAll(formData.nftContract, address);
      setApprovalStatus(isApproved);
    } catch (error) {
      console.error('Failed to check approval:', error);
      setApprovalStatus(null);
    }
  };

  const handleApproval = async () => {
    if (!formData.nftContract) {
      toast.error('Please enter NFT contract address first');
      return;
    }

    setApprovalLoading(true);
    try {
      await raffleService.approveForAll(formData.nftContract);
      setApprovalStatus(true);
      toast.success('NFT contract approved successfully!');
    } catch (error: any) {
      console.error('Approval failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Approval cancelled by user');
      } else {
        toast.error('Approval failed: ' + error.message);
      }
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleCreateRaffle = async () => {
    if (!formData.nftContract || !formData.tokenId || !formData.ticketPrice || !formData.maxTickets) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (approvalStatus !== true) {
      toast.error('Please approve the NFT contract first');
      return;
    }

    setLoading(true);
    try {
      const durationInSeconds = parseInt(formData.duration) * 3600; // Convert hours to seconds
      
      const result = await raffleService.createRaffle({
        nftContract: formData.nftContract,
        tokenId: formData.tokenId,
        ticketPrice: formData.ticketPrice,
        maxTickets: parseInt(formData.maxTickets),
        duration: durationInSeconds
      });

      toast.success('Raffle created successfully!');
      console.log('Raffle created:', result);
      
      // Reset form
      setFormData({
        nftContract: '',
        tokenId: '',
        ticketPrice: '0.1',
        maxTickets: '100',
        duration: '24'
      });
      setApprovalStatus(null);
      
    } catch (error: any) {
      console.error('Create raffle failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('Not NFT owner')) {
        toast.error('You do not own this NFT');
      } else {
        toast.error('Failed to create raffle: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalRevenue = (parseFloat(formData.ticketPrice || '0') * parseInt(formData.maxTickets || '0')).toFixed(2);
  const platformFeeAmount = (parseFloat(totalRevenue) * parseFloat(platformFee) / 100).toFixed(2);
  const creatorRevenue = (parseFloat(totalRevenue) - parseFloat(platformFeeAmount)).toFixed(2);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-4 sm:px-8 py-6 sm:py-8 border-b border-slate-700/50">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg sm:text-xl">🎫</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Create NFT Raffle</h2>
            <p className="text-slate-300 mt-1 text-sm sm:text-base">Turn your NFT into an exciting raffle with affordable tickets</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8">
        {/* Connected Wallet Info */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <p className="text-slate-300 text-xs sm:text-sm mb-1">
                <span className="font-semibold text-purple-400">Connected Wallet:</span> 
                <span className="font-mono ml-2">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </p>
              <p className="text-slate-400 text-xs">
                <span className="font-semibold">Network:</span> {NETWORK_CONFIG.name} (Chain ID: {NETWORK_CONFIG.chainId})
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs sm:text-sm font-medium">Platform Fee: {platformFee}%</span>
            </div>
          </div>
        </div>

        {/* APE Token Balance */}
        <div className="mb-6">
          <ApeTokenBalance />
        </div>

        {/* NFT Details Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                NFT Contract Address *
              </label>
              <input
                type="text"
                value={formData.nftContract}
                onChange={(e) => handleInputChange('nftContract', e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token ID *
              </label>
              <input
                type="text"
                value={formData.tokenId}
                onChange={(e) => handleInputChange('tokenId', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123"
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ticket Price (APE) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.ticketPrice}
                onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                placeholder="0.1"
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Tickets *
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.maxTickets}
                onChange={(e) => handleInputChange('maxTickets', e.target.value)}
                placeholder="100"
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration (Hours) *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
              >
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
                <option value="48">48 Hours</option>
                <option value="72">72 Hours</option>
                <option value="168">1 Week</option>
              </select>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-slate-600/30 rounded-xl p-4 sm:p-6 mt-6">
          <h4 className="font-semibold text-white mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500/20 rounded-lg flex items-center justify-center mr-2">
              <span className="text-green-400 text-xs">💰</span>
            </div>
            Revenue Summary (if all tickets sold)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 mb-1">Total Revenue</p>
              <p className="text-white font-mono text-lg">{totalRevenue} APE</p>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 mb-1">Platform Fee ({platformFee}%)</p>
              <p className="text-red-300 font-mono text-lg">-{platformFeeAmount} APE</p>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 mb-1">You Receive</p>
              <p className="text-green-300 font-mono text-lg">{creatorRevenue} APE</p>
            </div>
          </div>
        </div>

        {/* Approval Section */}
        {formData.nftContract && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6 mt-6">
            <h4 className="font-semibold text-white mb-3 flex items-center text-sm sm:text-base">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500/20 rounded-lg flex items-center justify-center mr-2">
                <span className="text-blue-400 text-xs">🔐</span>
              </div>
              NFT Approval Status
            </h4>
            
            {approvalStatus === null ? (
              <div className="flex items-center text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                Checking approval status...
              </div>
            ) : approvalStatus ? (
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">✅</span>
                NFT contract approved for raffle creation
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-yellow-400 text-sm">
                  <span className="mr-2">⚠️</span>
                  NFT contract not approved - approval required before creating raffle
                </div>
                <button
                  onClick={handleApproval}
                  disabled={approvalLoading}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {approvalLoading ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Approving...
                    </span>
                  ) : (
                    'Approve NFT Contract'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Raffle Button */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleCreateRaffle}
            disabled={loading || !formData.nftContract || !formData.tokenId || approvalStatus !== true}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm sm:text-base">Creating Raffle...</span>
              </span>
            ) : approvalStatus !== true ? (
              'Approve NFT Contract First'
            ) : (
              'Create Raffle'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}