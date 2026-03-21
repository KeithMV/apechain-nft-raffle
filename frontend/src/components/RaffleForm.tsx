import React, { useCallback } from 'react';
import { 
  sanitizeAddress, 
  sanitizeTokenId, 
  sanitizeNumber
} from '../utils/inputSanitizer';

export interface FormData {
  nftContract: string;
  tokenId: string;
  ticketPrice: string;
  maxTickets: string;
  duration: string;
}

interface RaffleFormProps {
  formData: FormData;
  onFormChange: (data: FormData) => void;
  isApeChain: boolean;
  nativeCurrency: string;
  disabled?: boolean;
}

// Pure validation function
const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const getInitialFormData = (): FormData => ({
  nftContract: '',
  tokenId: '',
  ticketPrice: '0.1',
  maxTickets: '100',
  duration: '24'
});

export default function RaffleForm({ 
  formData, 
  onFormChange, 
  isApeChain, 
  nativeCurrency, 
  disabled = false 
}: RaffleFormProps) {
  
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
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
        // Validate duration is within contract limits (1-720 hours)
        const durationNum = parseInt(value);
        if (isNaN(durationNum) || durationNum < 1 || durationNum > 720) {
          sanitizedValue = '24'; // Default to 24 hours if invalid
        } else {
          sanitizedValue = value; // Dropdown, already controlled
        }
        break;
    }
    
    // Only update if the value actually changed
    if (formData[field] !== sanitizedValue) {
      onFormChange({ ...formData, [field]: sanitizedValue });
    }
  }, [formData, onFormChange]);

  return (
    <div className="space-y-6">
      {/* NFT Contract and Token ID */}
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
            disabled={disabled}
            className={`w-full bg-slate-800/80 border ${
              isApeChain 
                ? 'border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/20' 
                : 'border-blue-400/30 focus:border-blue-400 focus:ring-blue-400/20'
            } rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:ring-2 transition-all font-mono backdrop-blur-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
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
            disabled={disabled}
            className={`w-full bg-slate-800/80 border ${
              isApeChain 
                ? 'border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/20' 
                : 'border-blue-400/30 focus:border-blue-400 focus:ring-blue-400/20'
            } rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:ring-2 transition-all font-mono backdrop-blur-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        </div>
      </div>

      {/* Raffle Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={`block text-sm font-medium ${
            isApeChain ? 'text-emerald-200' : 'text-blue-200'
          } mb-2 font-mono tracking-wider`}>
            Ticket Price ({nativeCurrency}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.ticketPrice}
            onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
            placeholder="0.1"
            disabled={disabled}
            className={`w-full bg-gray-800/90 border ${
              isApeChain 
                ? 'border-emerald-500/30 focus:border-emerald-400 focus:ring-emerald-400' 
                : 'border-blue-500/30 focus:border-blue-400 focus:ring-blue-400'
            } rounded-lg px-4 py-3 ${
              isApeChain 
                ? 'text-emerald-100 placeholder-emerald-400/50' 
                : 'text-blue-100 placeholder-blue-400/50'
            } focus:ring-1 transition-colors font-mono backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium ${
            isApeChain ? 'text-emerald-200' : 'text-blue-200'
          } mb-2 font-mono tracking-wider`}>
            Max Tickets *
          </label>
          <input
            type="number"
            min="1"
            max="10000"
            value={formData.maxTickets}
            onChange={(e) => handleInputChange('maxTickets', e.target.value)}
            placeholder="100"
            disabled={disabled}
            className={`w-full bg-gray-800/90 border ${
              isApeChain 
                ? 'border-emerald-500/30 focus:border-emerald-400 focus:ring-emerald-400' 
                : 'border-blue-500/30 focus:border-blue-400 focus:ring-blue-400'
            } rounded-lg px-4 py-3 ${
              isApeChain 
                ? 'text-emerald-100 placeholder-emerald-400/50' 
                : 'text-blue-100 placeholder-blue-400/50'
            } focus:ring-1 transition-colors font-mono backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium ${
            isApeChain ? 'text-emerald-200' : 'text-blue-200'
          } mb-2 font-mono tracking-wider`}>
            Duration *
          </label>
          <select
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            disabled={disabled}
            className={`w-full bg-gray-800/90 border ${
              isApeChain 
                ? 'border-emerald-500/30 focus:border-emerald-400 focus:ring-emerald-400' 
                : 'border-blue-500/30 focus:border-blue-400 focus:ring-blue-400'
            } rounded-lg px-4 py-3 ${
              isApeChain ? 'text-emerald-100' : 'text-blue-100'
            } focus:ring-1 transition-colors font-mono backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="1">1 HOUR</option>
            <option value="6">6 HOURS</option>
            <option value="12">12 HOURS</option>
            <option value="24">24 HOURS</option>
            <option value="48">48 HOURS</option>
            <option value="72">72 HOURS</option>
            <option value="168">1 WEEK</option>
            <option value="336">2 WEEKS</option>
            <option value="720">1 MONTH</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Export validation function for use in parent component
export { validateAddress };