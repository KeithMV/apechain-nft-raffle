/**
 * CRACO Performance Optimization Configuration
 * Phase C: Simplified but effective performance optimizations
 */
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations only
      if (env === 'production') {
        // Optimize chunk splitting for better caching
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            // React ecosystem
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            // Web3 libraries (largest bundle)
            web3: {
              test: /[\\/]node_modules[\\/](wagmi|viem|@wagmi)[\\/]/,
              name: 'web3',
              chunks: 'all',
              priority: 15,
            },
            // UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@headlessui|@heroicons)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 10,
            },
            // Default vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 5,
            },
          },
        };

        // Performance optimizations
        webpackConfig.optimization.usedExports = true;
        
        // Disable unnecessary features
        webpackConfig.plugins.push(
          new webpack.DefinePlugin({
            'process.env.WC_DISABLE_ANALYTICS': JSON.stringify('true'),
          })
        );
      }

      return webpackConfig;
    },
  },
};