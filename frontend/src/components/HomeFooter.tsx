/**
 * Home Footer Component
 * Footer section with branding and navigation links
 */

import React from 'react';

const HomeFooter: React.FC = () => {
  return (
    <footer style={{ 
      background: 'var(--neutral-800)', 
      borderTop: '1px solid var(--neutral-700)',
      padding: '40px 0'
    }}>
      <div className="container">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-primary mb-2">ApeChain Raffles</h3>
            <p className="text-sm text-muted">Decentralized NFT raffles on ApeChain</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
              Documentation
            </a>
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
              Support
            </a>
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;