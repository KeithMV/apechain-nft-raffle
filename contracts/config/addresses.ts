/**
 * Contract Addresses - Updated to match Frontend V4
 * NOTE: This file is for reference only - Frontend uses its own addresses.ts
 */

export const CONTRACT_ADDRESSES = {
  RAFFLE_FACTORY_V4: '0x1627E7e63b63878E61f91D336385a59B1747934a', // v4-CURRENT (matches frontend)
  RAFFLE_FACTORY_V3: '0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0', // v3-legacy
  RAFFLE_TEMPLATE: '0x242f56507BFd5034b369418A7C9FB1b4643710a4', // Current template
  RAFFLE_FACTORY_LEGACY: '0x05139110Db8FF9cF82A836Af95eff4530011c705' // v2-legacy
};

export const DEPLOYMENT_INFO = {
  network: 'apechain',
  deployer: '0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee',
  deployedAt: '2025-01-03T00:00:00.000Z', // Updated to V4 deployment
  platformFee: '500', // 5% (V4 fee)
  version: 'v4-fast-rate-limit', // Updated to current version
  securityFixes: ['Fixed reentrancy', 'Enhanced randomness', 'Block-based timing', 'Direct fee transfer to owner'],
  v4Features: ['10-second rate limit', '5% default fee', 'Faster raffle creation']
};