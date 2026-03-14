# ApeChain NFT Raffle Project Standards

## Project Overview
This is a full-stack Web3 NFT raffle application with React frontend, Solidity smart contracts, AWS infrastructure, and multi-chain support.

## Code Quality Standards

### Component Guidelines
- **Keep components under 200 lines** - extract into smaller components if larger
- **Single responsibility principle** - each component should have one clear purpose
- **Extract custom hooks** for complex logic (Web3 interactions, form handling, data fetching)
- **Proper TypeScript types** - avoid 'any', use proper interfaces
- **Consistent error handling** - use error boundaries and proper error states

### Web3 Patterns
- **Always handle network switching** - check current chain, provide switching UI
- **Implement proper loading states** for all blockchain operations
- **Use existing contract configurations** from config/addresses.ts
- **Follow established error handling** patterns for transaction failures
- **Security first** - never expose API keys, validate all inputs
- **Gas optimization** - minimize unnecessary contract calls

### File Organization
- **Components**: Single-purpose React components in src/components/
- **Hooks**: Custom hooks in src/hooks/ for reusable logic
- **Services**: API and external service calls in src/services/
- **Utils**: Pure utility functions in src/utils/
- **Types**: TypeScript interfaces in src/types/

## Technical Architecture

### Current Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Web3**: ethers.js with custom hooks (useRaffleContractV4, useUserNFTs)
- **Blockchain**: ApeChain mainnet (33139), Polygon support
- **Infrastructure**: AWS Lambda, CloudFront CDN, CircleCI
- **Smart Contracts**: Solidity with factory pattern, V4 versioning

### Environment Configuration
- **Development**: localhost:3000, local blockchain
- **Staging**: ApeChain mainnet, CloudFront at d1784e9dgxn2du.cloudfront.net
- **Production**: ApeChain mainnet, production CloudFront URL

### Security Measures
- **API keys secured** in Lambda environment variables
- **CORS handling** through Lambda proxy
- **Input validation** on all user inputs
- **Error boundaries** for graceful failure handling

## Development Workflow

### Git Workflow
- **develop** → **staging** → **main** (production)
- Feature branches merge to develop
- Staging deploys from staging branch
- Production deploys from main branch

### Code Review Focus
- Component complexity (flag >200 lines)
- Performance issues (unnecessary re-renders)
- Security concerns (API exposure, input validation)
- Web3 best practices (error handling, gas optimization)
- TypeScript usage (proper types, no 'any')

### Testing Strategy
- Unit tests for utility functions
- Component tests for UI logic
- Integration tests for Web3 interactions
- Manual testing on staging environment

## Known Technical Debt
- **God components**: CreateRafflePage (400+ lines), BrowseRaffles (500+ lines)
- **Performance issues**: Unnecessary re-renders, heavy computations in render
- **State management**: Scattered state, needs centralization
- **Code duplication**: Similar patterns repeated across components

## Refactoring Priorities
1. **Break up god components** into focused, single-purpose components
2. **Extract custom hooks** for complex logic
3. **Centralize state management** using Context or state management library
4. **Optimize performance** with proper memoization and code splitting
5. **Standardize patterns** for consistency across codebase

When working on this project, always consider these standards and prioritize maintainability, security, and user experience.