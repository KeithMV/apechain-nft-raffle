const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');

// Create a build with bundle analysis
const buildPath = path.join(__dirname, 'build', 'static', 'js');

// Analyze the existing build
const analyzer = new BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: path.join(__dirname, 'bundle-report.html'),
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: path.join(__dirname, 'bundle-stats.json')
});

console.log('Bundle analysis will be generated at: bundle-report.html');
console.log('Bundle stats will be saved to: bundle-stats.json');