/**
 * @deprecated This service is replaced by useNFTMetadata hook with better security and React Query caching
 * Use useNFTMetadata hook instead for all NFT metadata operations
 */

// Re-export the hook for backward compatibility
export { useNFTMetadata as nftMetadataService } from '../hooks/useNFTMetadata';