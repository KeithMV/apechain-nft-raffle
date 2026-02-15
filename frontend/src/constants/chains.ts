/**
 * Chain ID Constants
 * Centralized chain IDs to prevent hardcoded values throughout the codebase
 */

export const CHAIN_IDS = {
  APECHAIN_MAINNET: 33139,
  APECHAIN_TESTNET: 33111,
  POLYGON_MAINNET: 137,
  HARDHAT_LOCAL: 31337
} as const;

export const WALLET_IDS = {
  METAMASK: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
  RAINBOW: '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
  TRUST_WALLET: '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
  COINBASE: 'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
  LEDGER: '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927'
} as const;