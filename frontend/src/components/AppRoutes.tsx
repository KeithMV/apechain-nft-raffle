/**
 * App Routes Component
 * Centralized route definitions with lazy loading and error boundaries
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useNetwork } from '../contexts/NetworkContext';
import { ErrorBoundary, Web3ErrorBoundary } from './ErrorBoundary';

// Lazy load all heavy components for optimal performance
const CreateRafflePage = lazy(() => import('./CreateRafflePage'));
const RaffleDashboard = lazy(() => import('./RaffleDashboard'));
const BrowseRaffles = lazy(() => import('./BrowseRaffles'));
const TransactionDebugger = lazy(() => import('./TransactionDebugger'));

// Optimized loading fallback with memoization
const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center py-8">
    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
));

// Lazy wrapper component
const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

export const AppRoutes: React.FC = () => {
  const { chainId } = useNetwork();
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/browse" replace />} />
      <Route path="/browse" element={
        <ErrorBoundary>
          <LazyWrapper>
            <BrowseRaffles key={`browse-${chainId}`} />
          </LazyWrapper>
        </ErrorBoundary>
      } />
      <Route path="/create" element={
        <Web3ErrorBoundary>
          <LazyWrapper>
            <CreateRafflePage key={`create-${chainId}`} />
          </LazyWrapper>
        </Web3ErrorBoundary>
      } />
      <Route path="/dashboard" element={
        <ErrorBoundary>
          <LazyWrapper>
            <RaffleDashboard key={`dashboard-${chainId}`} />
          </LazyWrapper>
        </ErrorBoundary>
      } />
      <Route path="/debug" element={
        <ErrorBoundary>
          <LazyWrapper>
            <TransactionDebugger />
          </LazyWrapper>
        </ErrorBoundary>
      } />
    </Routes>
  );
};