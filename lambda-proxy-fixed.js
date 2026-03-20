// Fixed Lambda Image Proxy - Node.js 18 Compatible
// Addresses timeout issues and improves error handling

exports.handler = async (event) => {
    console.log('=== Lambda Image Proxy Started ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const imageUrl = event.queryStringParameters?.url;
    
    if (!imageUrl) {
        console.log('❌ Missing URL parameter');
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Missing url parameter' })
        };
    }
    
    console.log('🔍 Fetching URL:', imageUrl);
    
    try {
        // Node.js 18 compatible timeout implementation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Request timeout after 8 seconds');
            controller.abort();
        }, 8000);
        
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'ApeChain-NFT-Raffle/2.0',
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
            return {
                statusCode: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    url: imageUrl
                })
            };
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
        console.log('✅ Binary response size:', buffer.length, 'bytes');
        
        // Validate image size (max 10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            console.log('❌ Image too large:', buffer.length);
            return {
                statusCode: 413,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    error: 'Image too large (max 10MB)',
                    size: buffer.length
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400',
                'Content-Length': buffer.length.toString()
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
        
    } catch (error) {
        console.error('💥 Error occurred:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Handle specific error types
        let errorMessage = 'Proxy request failed';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout (8 seconds)';
            statusCode = 408;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network connection failed';
            statusCode = 502;
        }
        
        return {
            statusCode: statusCode,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: errorMessage,
                message: error.message,
                name: error.name,
                url: imageUrl
            })
        };
    }
};