exports.handler = async (event) => {
    const { url, contract, tokenId, owner, chainId } = event.queryStringParameters || {};
    
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // Handle OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    // Get Alchemy API key from environment (set in Lambda configuration)
    const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
    if (!ALCHEMY_API_KEY) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Alchemy API key not configured' })
        };
    }
    
    try {
        // Route 1: Get user's NFTs via Alchemy (NEW)
        if (owner && chainId) {
            const alchemyEndpoints = {
                '33139': 'https://apechain-mainnet.g.alchemy.com/nft/v3',
                '137': 'https://polygon-mainnet.g.alchemy.com/nft/v3',
                '1': 'https://eth-mainnet.g.alchemy.com/nft/v3',
                '42161': 'https://arb-mainnet.g.alchemy.com/nft/v3'
            };
            
            const endpoint = alchemyEndpoints[chainId];
            if (!endpoint) {
                return {
                    statusCode: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: `No Alchemy endpoint for chain ${chainId}` })
                };
            }
            
            const alchemyUrl = `${endpoint}/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&withMetadata=true&pageSize=100`;
            
            const response = await fetch(alchemyUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'ApeChain-NFT-Raffle/1.0'
                },
                signal: AbortSignal.timeout(15000)
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    statusCode: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'public, max-age=300' // 5 minute cache
                    },
                    body: JSON.stringify(data)
                };
            } else {
                return {
                    statusCode: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: `Alchemy API error: ${response.status}` })
                };
            }
        }
        
        // Route 2: Generic URL proxy (existing functionality)
        if (!url) {
            return {
                statusCode: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing required parameters: url (or owner+chainId for NFT list)' })
            };
        }
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ApeChain-NFT-Raffle/1.0',
                'Accept': '*/*'
            },
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    error: `HTTP ${response.status}: ${response.statusText}` 
                })
            };
        }
        
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Handle JSON responses (metadata)
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
            const text = await response.text();
            return {
                statusCode: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600'
                },
                body: text
            };
        }
        
        // Handle binary responses (images)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        return {
            statusCode: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'Proxy request failed',
                message: error.message 
            })
        };
    }
};