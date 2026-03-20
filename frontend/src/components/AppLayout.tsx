/**
 * App Layout Component
 * Main application layout with header and content area
 */

import React from 'react';
import { AppHeader } from './AppHeader';
import { AppRoutes } from './AppRoutes';

export const AppLayout: React.FC = () => {
  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <AppRoutes />
      </div>
    </>
  );
};