/**
 * Polyfill for React 19 compatibility
 * react-joyride uses unmountComponentAtNode which was removed in React 19
 * This polyfill provides backward compatibility
 */

import * as ReactDOM from 'react-dom';

// Polyfill unmountComponentAtNode for React 19
// This is a simple implementation that clears the container
// react-joyride uses this internally for cleanup
if (typeof window !== 'undefined' && !ReactDOM.unmountComponentAtNode) {
  (ReactDOM as any).unmountComponentAtNode = (container: Element | DocumentFragment | null) => {
    if (!container) {
      return false;
    }

    try {
      // For React 19, we just clear the container
      // The actual unmounting is handled by React's root system
      if (container instanceof Element || container instanceof DocumentFragment) {
        // Clear any React content
        const reactRoot = (container as any)._reactRootContainer;
        if (reactRoot && reactRoot.unmount) {
          reactRoot.unmount();
        }
        // Clear container as fallback
        container.innerHTML = '';
        return true;
      }
    } catch (e) {
      // Silently fail - this is just for cleanup
      console.warn('Error in unmountComponentAtNode polyfill:', e);
    }

    return false;
  };
}

