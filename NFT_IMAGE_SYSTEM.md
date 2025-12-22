# NFT Image Loading System

## Overview
Robust NFT image loading system with smart fallbacks, CORS handling, and IPFS support.

## Architecture

### Core Components
- **BasicNFTImage.tsx** - Main image component with URL cycling
- **SimpleImageProxy.ts** - Proxy service with fallback URLs
- **useNFTMetadata.ts** - Metadata fetching with multiple IPFS gateways

### Key Features
- ✅ **Smart URL Cycling** - Automatically tries fallback URLs when images fail
- ✅ **CORS Bypass** - Uses proxy services for cross-origin images
- ✅ **IPFS Support** - Multiple gateway fallbacks for IPFS URLs
- ✅ **Direct URL Fallbacks** - Tries direct URLs for CORS-enabled domains
- ✅ **Metadata Reset Logic** - Resets URL index when real metadata loads
- ✅ **Enhanced Debugging** - Detailed logging for troubleshooting

## URL Fallback Strategy

### For IPFS URLs (`ipfs://...`)
1. **Proxied IPFS Gateways** (through images.weserv.nl)
   - ipfs.io/ipfs/
   - gateway.pinata.cloud/ipfs/
   - dweb.link/ipfs/
2. **Final Fallback** - /placeholder-nft.svg

### For HTTP URLs
1. **Direct URL** (for img.op.xyz, img.other.page - CORS-enabled)
2. **Proxied URL** (through images.weserv.nl)
3. **Final Fallback** - /placeholder-nft.svg

## Critical Fixes Applied

### 1. URL Index Reset Bug
**Problem**: When metadata loaded, components stayed at `currentUrlIndex: 1` (placeholder) instead of resetting to 0 (real image).

**Solution**: Added useEffect to reset URL index when real metadata loads:
```typescript
useEffect(() => {
  if (metadata?.image && metadata.image !== '/placeholder-nft.svg') {
    setCurrentUrlIndex(0);
    setImageError(false);
  }
}, [metadata?.image]);
```

### 2. IPFS Gateway Failures
**Problem**: `cloudflare-ipfs.com` returning `net::ERR_NAME_NOT_RESOLVED`.

**Solution**: Removed unreliable gateway, prioritized working ones:
- ✅ ipfs.io/ipfs/
- ✅ gateway.pinata.cloud/ipfs/
- ✅ dweb.link/ipfs/

### 3. Proxy Service Blocking
**Problem**: `images.weserv.nl` blocking/failing to load `img.op.xyz` and `img.other.page` domains.

**Solution**: Added direct URL attempts for CORS-enabled domains before falling back to proxy.

## Usage

### Basic Usage
```typescript
import BasicNFTImage from './components/BasicNFTImage';

<BasicNFTImage 
  contractAddress="0x6f2A21A8B9CF699d7D3A713a9d7cFbB9E9760f97"
  tokenId="12345"
  size="lg"
  showName={true}
/>
```

### Size Options
- `sm` - 64x64px (w-16 h-16)
- `md` - 128x128px (w-32 h-32) 
- `lg` - Full container (w-full h-full)

## Debugging

### Console Logs
- 🔗 **URL Generation** - Shows fallback URLs being created
- 🖼️ **Render State** - Complete component state during rendering
- 🚨 **Image Errors** - Which URLs fail and at what index
- 🌐 **Gateway Attempts** - IPFS gateway cycling

### Debug Commands
```bash
# Enable detailed logging (already enabled in current build)
console.log('🖼️ BasicNFTImage rendering:', { ... });
```

## Performance Optimizations

### Caching
- **React Query** - 1 hour stale time, 24 hour cache time
- **OptimizedCache** - 5MB memory cache with 15min TTL
- **No Refetch** - Prevents excessive network requests

### Throttling
- **URL Generation** - Memoized to prevent regeneration
- **Error Handling** - Debounced to prevent rapid cycling

## Deployment

### Pipeline Deployment (Recommended)
```bash
git add .
git commit -m "NFT image updates"
git push origin main
```

### Manual Deployment (Development Only)
```bash
cd frontend && yarn build
cd ../infrastructure && npx cdk deploy
```

## Troubleshooting

### Common Issues

1. **Images Not Loading**
   - Check console for URL generation logs
   - Verify metadata is loading correctly
   - Test proxy URLs manually in browser

2. **Stuck on Placeholders**
   - Ensure useEffect dependency array includes `[metadata?.image]`
   - Check if `currentUrlIndex` is resetting to 0

3. **IPFS Images Failing**
   - Verify IPFS gateways are accessible
   - Check if IPFS hash format is valid

### Debug Checklist
- [ ] Metadata loading successfully?
- [ ] URLs being generated correctly?
- [ ] Image errors triggering URL cycling?
- [ ] Final fallback to placeholder working?

## Best Practices

1. **Always use BasicNFTImage** - Don't use raw `<img>` tags for NFTs
2. **Test with real NFT contracts** - Use actual contract addresses in development
3. **Monitor console logs** - Watch for patterns in image failures
4. **Update IPFS gateways** - Remove non-working gateways promptly

## Current Status
✅ **All components unified** - BrowseRaffles, RaffleDashboard, ProfessionalRaffleHome use BasicNFTImage
✅ **URL cycling fixed** - Properly resets when metadata loads
✅ **IPFS gateways optimized** - Removed failing cloudflare-ipfs.com
✅ **Direct URL fallbacks** - Added for img.op.xyz and img.other.page domains
✅ **Enhanced debugging** - Detailed logging for troubleshooting