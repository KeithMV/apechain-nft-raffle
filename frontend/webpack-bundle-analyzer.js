const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');

// Simple bundle analysis script
const fs = require('fs');

function analyzeBuildFolder() {
  const buildPath = path.join(__dirname, 'build', 'static', 'js');
  
  if (!fs.existsSync(buildPath)) {
    console.log('❌ Build folder not found. Run "yarn build" first.');
    return;
  }

  const files = fs.readdirSync(buildPath);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  console.log('\n📊 Bundle Analysis Report\n');
  console.log('=' .repeat(50));
  
  let totalSize = 0;
  const fileStats = [];
  
  jsFiles.forEach(file => {
    const filePath = path.join(buildPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalSize += sizeKB;
    
    fileStats.push({ file, size: sizeKB });
  });
  
  // Sort by size descending
  fileStats.sort((a, b) => b.size - a.size);
  
  console.log(`📦 Total Bundle Size: ${totalSize} KB`);
  console.log(`📁 Number of Chunks: ${jsFiles.length}`);
  console.log('\n🔍 Largest Files:');
  
  fileStats.slice(0, 10).forEach((stat, index) => {
    const percentage = Math.round((stat.size / totalSize) * 100);
    console.log(`${index + 1}. ${stat.file} - ${stat.size} KB (${percentage}%)`);
  });
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (totalSize > 500) {
    console.log('⚠️  Bundle size is large (>500KB). Consider:');
    console.log('   - Code splitting for route-based components');
    console.log('   - Tree shaking unused dependencies');
    console.log('   - Lazy loading non-critical components');
  }
  
  if (jsFiles.length > 20) {
    console.log('⚠️  Too many chunks. Consider:');
    console.log('   - Combining smaller chunks');
    console.log('   - Using dynamic imports more strategically');
  }
  
  const mainFile = fileStats.find(f => f.file.includes('main'));
  if (mainFile && mainFile.size > 300) {
    console.log('⚠️  Main bundle is large. Consider:');
    console.log('   - Moving vendor dependencies to separate chunk');
    console.log('   - Implementing route-based code splitting');
  }
  
  console.log('\n✅ Optimization Status:');
  console.log(`   Bundle Size: ${totalSize < 400 ? '✅ Good' : totalSize < 600 ? '⚠️  Acceptable' : '❌ Needs Optimization'}`);
  console.log(`   Chunk Count: ${jsFiles.length < 15 ? '✅ Good' : jsFiles.length < 25 ? '⚠️  Acceptable' : '❌ Too Many'}`);
  console.log(`   Main Bundle: ${mainFile && mainFile.size < 250 ? '✅ Good' : '⚠️  Could be smaller'}`);
  
  console.log('\n🎯 Performance Targets:');
  console.log('   - Total Bundle: <400KB (Current: ' + totalSize + 'KB)');
  console.log('   - Main Bundle: <250KB (Current: ' + (mainFile ? mainFile.size : 'N/A') + 'KB)');
  console.log('   - Chunk Count: <15 (Current: ' + jsFiles.length + ')');
  console.log('   - Load Time: <2s (Target for Phase 5)');
}

if (require.main === module) {
  analyzeBuildFolder();
}

module.exports = { analyzeBuildFolder };