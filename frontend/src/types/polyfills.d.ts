/**
 * TypeScript declarations for browser polyfills
 * Proper type-safe approach for mobile compatibility
 */

declare global {
  interface Window {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  }
}

export {};