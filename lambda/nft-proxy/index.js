// NFT Proxy Lambda - ApeChain NFT Raffle Platform
// Handles: NFT ownership queries, NFT metadata queries, image proxying
// Supported chains: ApeChain (33139), Polygon (137)

exports.handler = async (event) => {
    const params = event.queryStringParameters || {};
    const { url: imageUrl, owner, contractAddress, tokenId, chainId } = params;
    const environment = process.env.ENVIRONMENT || 'production';

    // NFT metadata query: ?contractAddress=&tokenId=&chainId=
    if (contractAddress && tokenId && chainId) {
        console.log('NFT metadata query:', { contractAddress, tokenId, chainId });
        return handleNFTMetadataQuery(contractAddress, tokenId, chainId, environment);
    }

    // NFT ownership query: ?owner=&chainId=
    if (owner && chainId) {
        console.log('NFT ownership query:', { owner, chainId });
        return handleNFTOwnershipQuery(owner, chainId, environment);
    }

    // Image proxy: ?url=
    if (imageUrl) {
        if (!isValidUrl(imageUrl)) {
            return errorResponse(400, 'Invalid or unsafe URL');
        }
        return proxyImage(imageUrl);
    }

    return errorResponse(400, 'Missing required parameters');
};

async function handleNFTMetadataQuery(contractAddress, tokenId, chainId, environment) {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) return errorResponse(500, 'Alchemy API not configured');

    const endpoint = alchemyEndpoint(chainId);
    if (!endpoint) return errorResponse(400, `Unsupported chain: ${chainId}`);

    const url = `${endpoint}/${apiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&refreshCache=false`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) return errorResponse(response.status, `Alchemy error: ${response.statusText}`);

        const nft = await response.json();
        const image = extractImage(nft);

        const metadata = {
            contractAddress: nft.contract?.address || contractAddress,
            tokenId: nft.tokenId || tokenId,
            name: nft.name || nft.title || `NFT #${tokenId}`,
            description: nft.description || '',
            image,
            metadata: {
                name: nft.name || nft.title,
                description: nft.description,
                image,
                attributes: nft.raw?.metadata?.attributes || []
            }
        };

        console.log(`NFT metadata fetched, has image: ${!!image}`);

        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: JSON.stringify({ success: true, nft: metadata, chainId: parseInt(chainId), source: 'alchemy' })
        };

    } catch (error) {
        if (error.name === 'AbortError') return errorResponse(408, 'Alchemy request timeout');
        console.error('NFT metadata error:', error.message);
        return errorResponse(502, 'NFT metadata query failed');
    }
}

async function handleNFTOwnershipQuery(owner, chainId, environment) {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) return errorResponse(500, 'Alchemy API not configured');

    const endpoint = alchemyEndpoint(chainId);
    if (!endpoint) return errorResponse(400, `Unsupported chain: ${chainId}`);

    const url = `${endpoint}/${apiKey}/getNFTsForOwner?owner=${owner}&withMetadata=true&pageSize=100`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) return errorResponse(response.status, `Alchemy error: ${response.statusText}`);

        const data = await response.json();

        const nfts = (data.ownedNfts || []).map(nft => {
            const image = extractImage(nft);
            return {
                contractAddress: nft.contract.address,
                tokenId: nft.tokenId,
                name: nft.name || nft.title || `NFT #${nft.tokenId}`,
                description: nft.description || '',
                image,
                metadata: {
                    name: nft.name || nft.title,
                    description: nft.description,
                    image,
                    attributes: nft.raw?.metadata?.attributes || []
                }
            };
        });

        console.log(`Fetched ${nfts.length} NFTs for chain ${chainId}, ${nfts.filter(n => n.image).length} with images`);

        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: JSON.stringify({
                success: true,
                totalCount: data.totalCount || 0,
                nfts,
                chainId: parseInt(chainId),
                owner,
                source: 'alchemy'
            })
        };

    } catch (error) {
        if (error.name === 'AbortError') return errorResponse(408, 'Alchemy request timeout');
        console.error('NFT ownership error:', error.message);
        return errorResponse(502, 'NFT ownership query failed');
    }
}

async function proxyImage(imageUrl) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(imageUrl, {
            headers: { 'User-Agent': 'ApeChainRaffles/2.0', 'Accept': '*/*' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) return errorResponse(response.status, `HTTP ${response.status}`, imageUrl);

        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
            const text = await response.text();
            return { statusCode: 200, headers: corsHeaders('application/json'), body: text };
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 10 * 1024 * 1024) return errorResponse(413, 'Image too large (max 10MB)');

        return {
            statusCode: 200,
            headers: { ...corsHeaders(contentType), 'Cache-Control': 'public, max-age=86400', 'Content-Length': buffer.length.toString() },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        if (error.name === 'AbortError') return errorResponse(408, 'Request timeout');
        return errorResponse(502, 'Proxy request failed', imageUrl);
    }
}

function extractImage(nft) {
    return nft.image?.cachedUrl ||
           nft.image?.thumbnailUrl ||
           nft.image?.originalUrl ||
           nft.media?.[0]?.gateway ||
           nft.media?.[0]?.raw ||
           nft.raw?.metadata?.image ||
           '';
}

function alchemyEndpoint(chainId) {
    const endpoints = {
        '33139': 'https://apechain-mainnet.g.alchemy.com/nft/v3',
        '137':   'https://polygon-mainnet.g.alchemy.com/nft/v3'
    };
    return endpoints[chainId] || null;
}

function isValidUrl(url) {
    try {
        const { protocol, hostname } = new URL(url);
        if (protocol !== 'https:') return false;
        const blocked = ['localhost', '169.254.169.254'];
        const blockedPrefixes = ['127.', '10.', '192.168.', '172.16.', '172.17.',
                                 '172.18.', '172.19.', '172.2', '172.30.', '172.31.'];
        if (blocked.some(b => hostname === b || hostname.includes(b))) return false;
        if (blockedPrefixes.some(p => hostname.startsWith(p))) return false;
        return true;
    } catch {
        return false;
    }
}

function corsHeaders(contentType = 'application/json') {
    return {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600'
    };
}

function errorResponse(statusCode, message, url = null) {
    return {
        statusCode,
        headers: corsHeaders(),
        body: JSON.stringify({ error: message, ...(url && { url }), timestamp: new Date().toISOString() })
    };
}
