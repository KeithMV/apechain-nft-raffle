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

    // Validate inputs
    const maxTickets = parseInt(formData.maxTickets);
    const ticketPrice = parseFloat(formData.ticketPrice);
    const duration = parseInt(formData.duration);

    if (maxTickets < 1 || maxTickets > 10000) {
      toast.error('Max tickets must be between 1 and 10,000');
      return;
    }

    if (ticketPrice <= 0) {
      toast.error('Ticket price must be greater than 0');
      return;
    }

    if (duration < 1 || duration > 168) { // Max 1 week
      toast.error('Duration must be between 1 and 168 hours');
      return;
    }

    setLoading(true);
    try {
      // Convert hours to blocks (ApeChain ~15 seconds per block)
      const durationInBlocks = Math.floor((duration * 3600) / 15); // Convert hours to blocks
      
      const result = await raffleService.createRaffle({
        nftContract: formData.nftContract,
        tokenId: formData.tokenId,
        ticketPrice: formData.ticketPrice,
        maxTickets: maxTickets,
        duration: durationInBlocks
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
      } else if (error.message?.includes('ERC721: caller is not token owner')) {
        toast.error('You do not own this NFT');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
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
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
              <span className="text-emerald-300 text-sm font-semibold">Platform Fee: {platformFee}%</span>
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
                className="w-full bg-gray-800/90 border border-pink-500/30 rounded-lg px-4 py-3 text-pink-100 placeholder-pink-400/50 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-colors font-mono backdrop-blur-sm"
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

        {/* Revenue Summary */}
        <div className="relative bg-gradient-to-r from-pink-900/20 via-fuchsia-900/20 to-purple-900/20 border border-pink-500/30 rounded-xl p-4 sm:p-6 mt-6 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-fuchsia-500/5 to-purple-500/5 rounded-xl blur-sm animate-pulse"></div>
          <h4 className="relative font-semibold text-pink-200 mb-3 sm:mb-4 flex items-center text-sm sm:text-base font-mono tracking-wider">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-pink-500/20 rounded-lg flex items-center justify-center mr-2">
              <span className="text-pink-400 text-xs">⚡</span>
            </div>
            Revenue Projection (Full Capacity)
          </h4>
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center p-3 bg-gray-800/60 border border-pink-500/20 rounded-lg backdrop-blur-sm">
              <p className="text-pink-300/70 mb-1 font-mono tracking-wide">Total Revenue</p>
              <p className="text-pink-200 font-mono text-lg tracking-wider">{totalRevenue} APE</p>
            </div>
            <div className="text-center p-3 bg-gray-800/60 border border-pink-500/20 rounded-lg backdrop-blur-sm">
              <p className="text-pink-300/70 mb-1 font-mono tracking-wide">Platform Fee ({platformFee}%)</p>
              <p className="text-red-300 font-mono text-lg tracking-wider">-{platformFeeAmount} APE</p>
            </div>
            <div className="text-center p-3 bg-gray-800/60 border border-pink-500/20 rounded-lg backdrop-blur-sm">
              <p className="text-pink-300/70 mb-1 font-mono tracking-wide">You Receive</p>
              <p className="text-pink-200 font-mono text-lg tracking-wider">{creatorRevenue} APE</p>
            </div>
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
                <button
                  onClick={handleApproval}
                  disabled={approvalLoading}
                  className="relative bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {approvalLoading ? (
                    <span className="relative flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Approving contract...
                    </span>
                  ) : (
                    <span className="relative">Approve NFT Contract</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Raffle Button */}
        <div className="relative flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleCreateRaffle}
            disabled={loading || !formData.nftContract || !formData.tokenId || approvalStatus !== true}
            className="relative flex-1 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:via-fuchsia-500 hover:to-purple-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/40 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono tracking-wider overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            {loading ? (
              <span className="relative flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm sm:text-base">Creating raffle...</span>
              </span>
            ) : approvalStatus !== true ? (
              <span className="relative">NFT Approval Required</span>
            ) : (
              <span className="relative">Create NFT Raffle</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}