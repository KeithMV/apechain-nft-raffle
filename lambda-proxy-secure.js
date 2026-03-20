// Secure Lambda Image Proxy - Multi-Environment Support
// Addresses SSRF vulnerabilities and environment isolation

exports.handler = async (event) => {
    console.log('=== Lambda Image Proxy Started ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const imageUrl = event.queryStringParameters?.url;
    const environment = process.env.ENVIRONMENT || 'production';
    
    console.log('Environment:', environment);
    
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
            'w3s.link'
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