/**
 * CRACO Performance Optimization Configuration
 * Phase 3: Advanced performance optimizations for production builds
 */
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === 'production') {
        // Enhanced chunk splitting for better caching
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // React ecosystem
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // Web3 libraries (split into smaller chunks)
            wagmi: {
              test: /[\\/]node_modules[\\/](@wagmi|wagmi)[\\/]/,
              name: 'wagmi',
              chunks: 'all',
              priority: 25,
            },
            viem: {
              test: /[\\/]node_modules[\\/]viem[\\/]/,
              name: 'viem',
              chunks: 'all',
              priority: 24,
            },
            // Query libraries
            query: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'query',
              chunks: 'all',
              priority: 20,
            },
            // UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@headlessui|@heroicons)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
            // Crypto libraries
            crypto: {
              test: /[\\/]node_modules[\\/](@stablelib)[\\/]/,
              name: 'crypto',
              chunks: 'all',
              priority: 12,
            },
            // Common vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 5,
              minChunks: 2,
            },
          },
        };

        // Enhanced performance optimizations
        webpackConfig.optimization.usedExports = true;
        webpackConfig.optimization.sideEffects = false;
        webpackConfig.optimization.moduleIds = 'deterministic';
        webpackConfig.optimization.chunkIds = 'deterministic';
        
        // Disable unnecessary features for performance
        webpackConfig.plugins.push(
          new webpack.DefinePlugin({
            'process.env.WC_DISABLE_ANALYTICS': JSON.stringify('true'),
            'process.env.NODE_ENV': JSON.stringify('production'),
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
          })
        );
        
        // Remove problematic aliases - let webpack handle React resolution
      }
      
      // Development optimizations
      if (env === 'development') {
        // Faster source maps
        webpackConfig.devtool = 'eval-cheap-module-source-map';
        
        // Optimize resolve for faster rebuilds
        webpackConfig.resolve.symlinks = false;
        webpackConfig.resolve.cacheWithContext = false;
      }

      return webpackConfig;
    },
  },
};