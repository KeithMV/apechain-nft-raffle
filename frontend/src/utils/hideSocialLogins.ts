// Hide social login elements in Web3Modal
export const hideSocialLogins = () => {
  const hideElements = () => {
    // Debug: Log what we find
    console.log('Searching for social login elements...');
    
    // More specific Web3Modal selectors
    const selectors = [
      'w3m-email-login-widget',
      'w3m-social-login-widget', 
      'w3m-connect-email-button',
      'w3m-connect-socials-button',
      '[data-testid="w3m-email-login"]',
      '[data-testid="w3m-social-login"]',
      'wui-separator:has-text("or")',
      'wui-text:has-text("Email")',
      'wui-text:has-text("Social")',
    ];

    // Check all elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.textContent?.toLowerCase().includes('email') || 
          el.textContent?.toLowerCase().includes('social') ||
          el.textContent?.toLowerCase().includes('google') ||
          el.textContent?.toLowerCase().includes('continue with')) {
        console.log('Found potential social element:', el);
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      }
    });

    // Check Web3Modal shadow DOM
    const w3mElements = document.querySelectorAll('w3m-modal, w3m-connect-button, w3m-router');
    w3mElements.forEach(modal => {
      console.log('Checking modal:', modal);
      if (modal.shadowRoot) {
        const shadowAll = modal.shadowRoot.querySelectorAll('*');
        shadowAll.forEach(el => {
          if (el.textContent?.toLowerCase().includes('email') || 
              el.textContent?.toLowerCase().includes('social')) {
            console.log('Found shadow social element:', el);
            if (el instanceof HTMLElement) {
              el.style.display = 'none';
            }
          }
        });
      }
    });
  };

  // Run with delay to catch dynamically loaded content
  setTimeout(hideElements, 100);
  setTimeout(hideElements, 500);
  setTimeout(hideElements, 1000);
  
  // Watch for DOM changes
  const observer = new MutationObserver(() => {
    setTimeout(hideElements, 50);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
};