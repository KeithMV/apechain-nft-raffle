/**
 * Performance Optimization Utilities
 * Implements lazy loading, code splitting, and bundle optimization
 */

import React, { lazy, ComponentType } from 'react';

// Lazy loading with error boundaries
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): ComponentType<any> {
  const LazyComponent = lazy(importFn);
  
  // Return component with built-in error handling
  return (props: any) => {
    try {
      return React.createElement(LazyComponent, props);
    } catch (error) {
      console.error('Lazy component loading failed:', error);
      return fallback ? React.createElement(fallback, props) : null;
    }
  };
}

// Preload critical components
export function preloadComponent(importFn: () => Promise<any>): void {
  // Use requestIdleCallback for non-blocking preloading
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(error => {
        console.warn('Component preload failed:', error);
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Component preload failed:', error);
      });
    }, 100);
  }
}

// Resource hints for performance
export function addResourceHints(): void {
  if (typeof document === 'undefined') return;

  const head = document.head;
  
  // Preconnect to external domains
  const preconnectDomains = [
    'https://apechain.calderachain.xyz',
    'https://rpc.apechain.com',
    'https://apechain-mainnet.g.alchemy.com',
    'https://fonts.reown.com'
  ];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    head.appendChild(link);
  });

  // DNS prefetch for additional domains
  const dnsPrefetchDomains = [
    'https://apechain.calderaexplorer.xyz',
    'https://ipfs.io',
    'https://gateway.pinata.cloud'
  ];

  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    head.appendChild(link);
  });
}

// Bundle size monitoring
export function logBundleInfo(): void {
  if (process.env.NODE_ENV === 'development') {
    // Monitor performance metrics
    if ('performance' in window && 'getEntriesByType' in performance) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        console.group('📊 Performance Metrics');
        console.log('🚀 Page Load Time:', Math.round(navigation.loadEventEnd - navigation.fetchStart), 'ms');
        console.log('📦 Total Resources:', resources.length);
        console.log('💾 JS Bundle Size:', Math.round(
          resources
            .filter(r => r.name.includes('.js'))
            .reduce((total, r) => total + (r.transferSize || 0), 0) / 1024
        ), 'KB');
        console.groupEnd();
      }, 2000);
    }
  }
}

// Memory cleanup utilities
export function cleanupResources(): void {
  // Clear any cached data that's no longer needed
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old-') || name.includes('temp-')) {
          caches.delete(name);
        }
      });
    });
  }
}

// Initialize performance optimizations
export function initializePerformanceOptimizations(): void {
  // Add resource hints
  addResourceHints();
  
  // Log bundle info in development
  logBundleInfo();
  
  // Set up cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanupResources);
  }
}