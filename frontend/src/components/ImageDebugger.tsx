import React, { useState, useEffect } from 'react';
import { SimpleImageProxy } from '../services/SimpleImageProxy';

interface TestResult {
  url: string;
  success: boolean;
  error?: string;
  status?: number;
  loadTime?: number;
}

interface ImageDebuggerProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageDebugger({ imageUrl, onClose }: ImageDebuggerProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      testImageUrls();
    }
  }, [imageUrl]);

  const testImageUrls = async () => {
    setTesting(true);
    const fallbackUrls = SimpleImageProxy.getFallbackUrls(imageUrl);
    const results: TestResult[] = [];

    for (const url of fallbackUrls) {
      const startTime = Date.now();
      try {
        const result = await SimpleImageProxy.testImageUrl(url);
        const loadTime = Date.now() - startTime;
        results.push({
          url,
          success: result.success,
          error: result.error,
          status: result.status,
          loadTime
        });
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          loadTime: Date.now() - startTime
        });
      }
    }

    setTestResults(results);
    setTesting(false);
  };

  const getStatusColor = (success: boolean, status?: number) => {
    if (success) return 'text-green-400';
    if (status === 404) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (success: boolean, status?: number) => {
    if (success) return '✅';
    if (status === 404) return '⚠️';
    return '❌';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Image Loading Debugger</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Original URL:</h3>
          <div className="bg-slate-900 p-3 rounded-lg">
            <code className="text-green-400 text-sm break-all">{imageUrl}</code>
          </div>
        </div>

        {testing ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Testing fallback URLs...</p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Fallback URL Test Results ({testResults.length} URLs tested)
            </h3>
            
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-slate-900 p-4 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: result.success ? '#10b981' : 
                                   result.status === 404 ? '#f59e0b' : '#ef4444'
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getStatusIcon(result.success, result.status)}
                      </span>
                      <span className={`font-semibold ${getStatusColor(result.success, result.status)}`}>
                        {result.success ? 'SUCCESS' : 
                         result.status === 404 ? 'NOT FOUND' : 'FAILED'}
                      </span>
                      {result.status && (
                        <span className="text-gray-400 text-sm">
                          (HTTP {result.status})
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">
                      {result.loadTime}ms
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <code className="text-blue-400 text-xs break-all">
                      {result.url}
                    </code>
                  </div>
                  
                  {result.error && (
                    <div className="text-red-400 text-sm">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.success && (
                    <div className="mt-2">
                      <img
                        src={result.url}
                        alt="Test"
                        className="w-16 h-16 object-cover rounded border border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-slate-900 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Recommendations:</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                {testResults.some(r => r.success) ? (
                  <li className="text-green-400">✅ At least one fallback URL is working</li>
                ) : (
                  <li className="text-red-400">❌ All fallback URLs failed - check original image source</li>
                )}
                
                {testResults.filter(r => r.url.includes('w7pllimgd5')).some(r => !r.success) && (
                  <li className="text-yellow-400">⚠️ Lambda proxy issues detected - check CloudWatch logs</li>
                )}
                
                {testResults.filter(r => r.status === 404).length > 0 && (
                  <li className="text-yellow-400">⚠️ Some URLs return 404 - image may not exist at source</li>
                )}
                
                {testResults.some(r => r.loadTime && r.loadTime > 5000) && (
                  <li className="text-yellow-400">⚠️ Slow loading detected - consider image optimization</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={testImageUrls}
            disabled={testing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {testing ? 'Testing...' : 'Retest URLs'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}