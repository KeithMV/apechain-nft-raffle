exports.handler = async (event) => {
    const imageUrl = event.queryStringParameters?.url;
    
    if (!imageUrl) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Missing url parameter' })
        };
    }
    
    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'ApeChain-NFT-Raffle/1.0'
            },
            signal: AbortSignal.timeout(5000)  // 5 second timeout
        });
        
        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
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
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
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
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Proxy request failed',
                message: error.message 
            })
        };
    }
};