/**
 * Lazy-loaded components with optimized loading
 */
import { lazy, Suspense } from 'react';
import { ComponentLoadingFallback } from './LoadingFallback';

// Lazy load heavy components
export const CreateRafflePage = lazy(() => import('./CreateRafflePage'));
export const RaffleDashboard = lazy(() => import('./RaffleDashboard'));
export const BrowseRaffles = lazy(() => import('./BrowseRaffles'));
export const WalletInfo = lazy(() => import('./WalletInfo'));
export const ProfessionalDemo = lazy(() => import('./ProfessionalDemo'));
export const AdminDashboard = lazy(() => import('./AdminDashboard'));
export const EmergencyControls = lazy(() => import('./EmergencyControls'));

// Wrapper component with error boundary
export function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ComponentLoadingFallback />}>
      {children}
    </Suspense>
  );
}