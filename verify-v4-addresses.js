#!/usr/bin/env node

// Verification script to ensure all V4 contract addresses are properly configured

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying V4 Contract Address Configuration...\n');

const V4_FACTORY_ADDRESS = '0xC9Bd344f5E31481F202E400C33210Bd1AB542b42';
const V4_TEMPLATE_ADDRESS = '0x7487bb0DdAd2d7ff7C59869536cbDcEBAd29D55e';

// Files to check
const filesToCheck = [
  'frontend/.env',
  'frontend/.env.production', 
  'frontend/.env.staging',
  'frontend/.env.example',
  'frontend/src/config/unified.ts',
  'frontend/src/config/environment.ts',
  'subgraph/subgraph.yaml'
];

let allGood = true;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check for V4 factory address
  if (content.includes(V4_FACTORY_ADDRESS)) {
    console.log(`✅ ${filePath} - Contains V4 factory address`);
  } else {
    console.log(`❌ ${filePath} - Missing V4 factory address`);
    allGood = false;
  }
  
  // Check for old addresses that shouldn't be there
  const oldAddresses = [
    '0x1627E7e63b63878E61f91D336385a59B1747934a',
    '0x05139110Db8FF9cF82A836Af95eff4530011c705'
  ];
  
  oldAddresses.forEach(oldAddr => {
    if (content.includes(oldAddr)) {
      console.log(`⚠️  ${filePath} - Still contains old address: ${oldAddr}`);
      allGood = false;
    }
  });
});

console.log('\n📊 Configuration Summary:');
console.log(`- V4 Factory Address: ${V4_FACTORY_ADDRESS}`);
console.log(`- V4 Template Address: ${V4_TEMPLATE_ADDRESS}`);

if (allGood) {
  console.log('\n🎉 All configuration files are properly updated with V4 addresses!');
  console.log('\n📋 Next Steps:');
  console.log('1. Deploy the updated frontend build');
  console.log('2. Clear browser cache to ensure new addresses are loaded');
  console.log('3. Test raffle creation on both ApeChain and Polygon');
  console.log('4. Verify Dashboard and Browse pages show NFTs correctly');
} else {
  console.log('\n❌ Some configuration files still need updates');
}