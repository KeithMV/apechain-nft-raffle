# STAGING HOTFIX PLAN

## Issues Identified:
1. Desktop wallet connection broken
2. No raffles showing in dashboard
3. Core functionality broken

## Root Cause Analysis:
The recent dashboard consistency fixes introduced breaking changes to:
- RPC configuration (rpcConfig.ts)
- Wagmi configuration (wagmiUnified.ts) 
- Environment detection (environment.ts)

## Hotfix Strategy:
1. Revert to minimal changes approach
2. Keep only essential deduplication fixes
3. Remove complex RPC configuration changes
4. Restore working wallet connection

## Files to Fix:
- Remove rpcConfig.ts (new file causing issues)
- Simplify wagmiUnified.ts back to working state
- Keep only the deduplication logic in useRafflePositionsV4.ts
- Keep React key fixes
- Remove random delays that might be breaking data loading

## Target: Get staging back to working state with minimal dashboard improvements