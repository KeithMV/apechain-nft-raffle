/**
 * CRACO configuration for optimizing Web3Modal bundle size
 * Minimal configuration to avoid conflicts
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
            // Separate Web3Modal into its own chunk for better caching
            web3modal: {
              test: /[\\/]node_modules[\\/]@web3modal[\\/]/,
              name: 'web3modal',
              chunks: 'all',
              priority: 10,
            },
            // Separate wagmi/viem into their own chunk
            web3: {
              test: /[\\/]node_modules[\\/](wagmi|viem)[\\/]/,
              name: 'web3',
              chunks: 'all',
              priority: 9,
            },
            // Default vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 1,
            },
          },
        };

        // Disable features we don't need
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