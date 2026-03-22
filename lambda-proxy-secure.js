// Secure Lambda Image Proxy - Multi-Environment Support
// Addresses SSRF vulnerabilities and environment isolation

exports.handler = async (event) => {
    console.log('=== Lambda Image Proxy Started ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const imageUrl = event.queryStringParameters?.url;
    const owner = event.queryStringParameters?.owner;
    const chainId = event.queryStringParameters?.chainId;
    const environment = process.env.ENVIRONMENT || 'production';
    
    console.log('Environment:', environment);
    
    // Handle NFT ownership queries (Alchemy API integration)
    if (owner && chainId) {
        console.log('🔍 NFT ownership query:', { owner, chainId });
        return await handleNFTOwnershipQuery(owner, chainId, environment);
    }
    
    // Handle image proxy requests
    if (!imageUrl) {
        console.log('❌ Missing URL parameter');
        return createErrorResponse(400, 'Missing url parameter');
    }
    
    // SECURITY: Validate URL to prevent SSRF attacks
    if (!isValidUrl(imageUrl)) {
        console.log('❌ Invalid or unsafe URL:', imageUrl);
        return createErrorResponse(400, 'Invalid or unsafe URL provided');
    }
    
    console.log('🔍 Fetching URL:', imageUrl);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Request timeout after 8 seconds');
            controller.abort();
        }, 8000);
        
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': `ApeChain-NFT-Raffle/2.0 (${environment})`,
                'Accept': '*/*',
                'Cache-Control': 'no-cache'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('📊 Response status:', response.status);
        console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            console.log('❌ Response not OK:', response.status, response.statusText);
            return createErrorResponse(response.status, `HTTP ${response.status}: ${response.statusText}`, imageUrl);
        }
        
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        console.log('📄 Content type:', contentType);
        
        // Handle JSON responses (metadata)
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
            const text = await response.text();
            console.log('✅ JSON response length:', text.length);
            
            // Validate JSON
            try {
                JSON.parse(text);
            } catch (jsonError) {
                console.log('⚠️ Invalid JSON response, treating as text');
            }
            
            return {
                statusCode: 200,
                headers: createCorsHeaders(environment, 'application/json'),
                body: text
            };
        }
        
        // Handle binary responses (images)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('✅ Binary response size:', buffer.length, 'bytes');
        
        // Validate image size (max 10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            console.log('❌ Image too large:', buffer.length);
            return createErrorResponse(413, 'Image too large (max 10MB)', null, buffer.length);
        }
        
        return {
            statusCode: 200,
            headers: {
                ...createCorsHeaders(environment, contentType),
                'Content-Length': buffer.length.toString()
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
        
    } catch (error) {
        console.error('💥 Error occurred:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Proxy request failed';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout (8 seconds)';
            statusCode = 408;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network connection failed';
            statusCode = 502;
        }
        
        return createErrorResponse(statusCode, errorMessage, imageUrl, null, error.message);
    }
};

// SECURITY: URL validation to prevent SSRF attacks
function isValidUrl(url) {
    try {
        const parsedUrl = new URL(url);
        
        // Block private IP ranges and localhost
        const hostname = parsedUrl.hostname.toLowerCase();
        
        // Block localhost and private IPs
        if (hostname === 'localhost' || 
            hostname.startsWith('127.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('172.16.') ||
            hostname.startsWith('172.17.') ||
            hostname.startsWith('172.18.') ||
            hostname.startsWith('172.19.') ||
            hostname.startsWith('172.2') ||
            hostname.startsWith('172.30.') ||
            hostname.startsWith('172.31.') ||
            hostname === '169.254.169.254' || // AWS metadata service
            hostname.includes('metadata')) {
            console.log('🚫 Blocked private/internal URL:', hostname);
            return false;
        }
        
        // Only allow HTTPS
        if (parsedUrl.protocol !== 'https:') {
            console.log('🚫 Only HTTPS URLs allowed');
            return false;
        }
        
        // Allowlist trusted domains for NFT/IPFS content
        const trustedDomains = [
            'ipfs.io',
            'gateway.pinata.cloud',
            'dweb.link',
            'cloudflare-ipfs.com',
            'img.op.xyz',
            'img.other.page',
            'arweave.net',
            'nftstorage.link',
            'w3s.link',
            // Additional NFT metadata domains
            'api.other.page',
            'api.op.xyz',
            'api2.balloonsballoons.xyz',
            'metadata.ens.domains',
            'api.opensea.io',
            // Polygon-specific domains
            'polygon-metadata.s3.amazonaws.com',
            'assets.polygon.technology',
            'ipfs.moralis.io',
            'gateway.ipfs.io',
            // Additional IPFS gateways
            'cf-ipfs.com',
            'ipfs.infura.io',
            // Pinata domains (all subdomains)
            'mypinata.cloud',
            'pinata.cloud',
            'gateway.pinata.cloud',
            // Common Polygon NFT platforms
            'opensea.io',
            'looksrare.org',
            'rarible.com',
            'foundation.app',
            'superrare.com',
            // Additional metadata services
            'metadata.buildship.xyz',
            'api.reservoir.tools',
            'metadata.degods.com'
        ];
        
        const isAllowed = trustedDomains.some(domain => hostname.includes(domain));
        if (!isAllowed) {
            console.log('🚫 Domain not in allowlist:', hostname);
        }
        
        return isAllowed;
    } catch (error) {
        console.log('🚫 Invalid URL format:', error.message);
        return false;
    }
}

// Environment-aware CORS headers
function createCorsHeaders(environment, contentType = 'application/json') {
    const allowedOrigins = {
        production: 'https://apechainraffles.io',
        staging: 'https://d1784e9dgxn2du.cloudfront.net',
        development: '*'
    };
    
    return {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': allowedOrigins[environment] || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': contentType.includes('image') ? 'public, max-age=86400' : 'public, max-age=3600'
    };
}

// Handle NFT ownership queries using Alchemy API
async function handleNFTOwnershipQuery(owner, chainId, environment) {
    const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
    
    if (!ALCHEMY_API_KEY) {
        console.log('❌ Missing ALCHEMY_API_KEY environment variable');
        return createErrorResponse(500, 'Alchemy API not configured');
    }
    
    const ALCHEMY_ENDPOINTS = {
        33139: 'https://apechain-mainnet.g.alchemy.com/nft/v3', // ApeChain
        137: 'https://polygon-mainnet.g.alchemy.com/nft/v3',   // Polygon
        1: 'https://eth-mainnet.g.alchemy.com/nft/v3',          // Ethereum
        42161: 'https://arb-mainnet.g.alchemy.com/nft/v3'       // Arbitrum
    };
    
    const endpoint = ALCHEMY_ENDPOINTS[chainId];
    if (!endpoint) {
        console.log('❌ Unsupported chain ID:', chainId);
        return createErrorResponse(400, `Unsupported chain ID: ${chainId}`);
    }
    
    console.log(`📡 Fetching NFTs for chain ${chainId} (${chainId === 137 ? 'Polygon' : chainId === 33139 ? 'ApeChain' : 'Other'})`);
    const url = `${endpoint}/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&withMetadata=true&pageSize=100`;
    
    try {
        console.log('📡 Fetching NFTs from Alchemy:', { owner, chainId, endpoint: endpoint.split('/').slice(0, 3).join('/') + '/...' });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Alchemy request timeout after 10 seconds');
            controller.abort();
        }, 10000);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': `ApeChain-NFT-Raffle/2.0 (${environment})`
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.log('❌ Alchemy API error:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error details:', errorText);
            return createErrorResponse(response.status, `Alchemy API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Alchemy response for chain ${chainId}:`, { totalCount: data.totalCount, returned: data.ownedNfts?.length });
        
        // Transform Alchemy response to match our expected format
        const nfts = (data.ownedNfts || []).map(nft => {
            // Enhanced image URL processing for different chains
            let imageUrl = nft.media?.[0]?.gateway || nft.media?.[0]?.raw || '';
            
            // Special handling for Polygon NFTs with common metadata issues
            if (chainId === 137 && !imageUrl && nft.rawMetadata?.image) {
                imageUrl = nft.rawMetadata.image;
            }
            
            return {
                contractAddress: nft.contract.address,
                tokenId: nft.tokenId,
                name: nft.title || nft.name || `NFT #${nft.tokenId}`,
                description: nft.description || '',
                image: imageUrl,
                metadata: {
                    name: nft.title || nft.name,
                    description: nft.description,
                    image: imageUrl,
                    attributes: nft.rawMetadata?.attributes || []
                }
            };
        });
        
        console.log(`🖼️ Processed ${nfts.length} NFTs for chain ${chainId}, ${nfts.filter(n => n.image).length} with images`);
        
        return {
            statusCode: 200,
            headers: createCorsHeaders(environment),
            body: JSON.stringify({
                success: true,
                totalCount: data.totalCount || 0,
                nfts: nfts,
                chainId: parseInt(chainId),
                owner: owner,
                source: 'alchemy',
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('💥 Alchemy API error:', error);
        
        let errorMessage = 'NFT query failed';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            errorMessage = 'Alchemy API timeout (10 seconds)';
            statusCode = 408;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Alchemy API connection failed';
            statusCode = 502;
        }
        
        return createErrorResponse(statusCode, errorMessage, null, null, error.message);
    }
}

// Standardized error response
function createErrorResponse(statusCode, message, url = null, size = null, originalError = null) {
    const environment = process.env.ENVIRONMENT || 'production';
    
    return {
        statusCode: statusCode,
        headers: createCorsHeaders(environment),
        body: JSON.stringify({ 
            error: message,
            ...(url && { url }),
            ...(size && { size }),
            ...(originalError && environment !== 'production' && { originalError }),
            environment,
            timestamp: new Date().toISOString()
        })
    };
}