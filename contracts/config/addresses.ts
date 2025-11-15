/**
 * Updated Contract Addresses - Secure Version
 */

export const CONTRACT_ADDRESSES = {
  RAFFLE_FACTORY: '0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0', // v3-secure
  RAFFLE_TEMPLATE: '0xF038C04c3384419B91094Fbc21437E96c8fC1e59',
  RAFFLE_FACTORY_LEGACY: '0x05139110Db8FF9cF82A836Af95eff4530011c705' // v2-legacy
};

export const DEPLOYMENT_INFO = {
  network: 'apechain',
  deployer: '0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee',
  deployedAt: '2025-11-15T05:30:00.000Z',
  platformFee: '1000', // 10%
  version: 'v3-secure',
  securityFixes: ['Fixed reentrancy', 'Enhanced randomness', 'Block-based timing']
};