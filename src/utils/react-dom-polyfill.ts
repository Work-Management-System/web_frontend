/**
 * React DOM Polyfill for React 19
 * This file patches react-dom to add unmountComponentAtNode for react-joyride compatibility
 * Must be imported before react-joyride
 */

// Run immediately, not just in browser
try {
  const ReactDOM = require('react-dom');
  
  // Polyfill unmountComponentAtNode if it doesn't exist
  if (!ReactDOM.unmountComponentAtNode) {
    ReactDOM.unmountComponentAtNode = function(container: Element | DocumentFragment | null) {
      if (!container) {
        return false;
      }

      try {
        // For React 19, we need to handle unmounting differently
        if (container instanceof Element || container instanceof DocumentFragment) {
          // Check for React 19 root instance
          const reactRoot = (container as any)._reactRootContainer;
          if (reactRoot && typeof reactRoot.unmount === 'function') {
            reactRoot.unmount();
            return true;
          }
          
          // Fallback: clear the container
          if ('innerHTML' in container) {
            (container as Element).innerHTML = '';
          }
          return true;
        }
      } catch (e) {
        // Silently handle errors - this is cleanup code
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error in unmountComponentAtNode polyfill:', e);
        }
      }

      return false;
    };
  }
} catch (e) {
  // Ignore errors during SSR
  if (process.env.NODE_ENV === 'development') {
    console.warn('Could not patch react-dom:', e);
  }
}

export {};

