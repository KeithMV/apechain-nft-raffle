/**
 * Secure Contract Addresses - v3 with Security Fixes
 */

export const SECURE_CONTRACT_ADDRESSES = {
  RAFFLE_FACTORY_SECURE: '0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0',
  RAFFLE_TEMPLATE_SECURE: '0xF038C04c3384419B91094Fbc21437E96c8fC1e59'
};

export const LEGACY_CONTRACT_ADDRESSES = {
  RAFFLE_FACTORY_V2: '0x05139110Db8FF9cF82A836Af95eff4530011c705',
  RAFFLE_TEMPLATE_V2: '0xB92a6C1132C6F42fC7335aa341B0AABF33ee609E'
};

export const DEPLOYMENT_INFO_SECURE = {
  network: 'apechain',
  deployer: '0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee',
  deployedAt: '2025-11-15T05:30:00.000Z',
  platformFee: 1000, // 10% (basis points)
  version: 'v3-secure',
  securityFixes: [
    'Fixed weak randomness vulnerability',
    'Fixed reentrancy in factory',
    'Reduced timestamp dependence',
    'Enhanced input validation',
    'Added batch operations',
    'Improved error handling'
  ]
};

// Migration helper
export const CONTRACT_MIGRATION = {
  oldFactory: LEGACY_CONTRACT_ADDRESSES.RAFFLE_FACTORY_V2,
  newFactory: SECURE_CONTRACT_ADDRESSES.RAFFLE_FACTORY_SECURE,
  migrationDate: '2025-11-15',
  status: 'DEPLOYED'
};