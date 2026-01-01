/**
 * React DOM Shim for React 19 compatibility
 * This provides unmountComponentAtNode for react-joyride
 */

const ReactDOM = require('react-dom');
const { createRoot } = require('react-dom/client');

// Store root instances for containers
const rootMap = new WeakMap();

// Polyfill unmountComponentAtNode
if (!ReactDOM.unmountComponentAtNode) {
  ReactDOM.unmountComponentAtNode = function(container) {
    if (!container) {
      return false;
    }

    try {
      // Check for existing root
      const root = rootMap.get(container);
      if (root) {
        root.unmount();
        rootMap.delete(container);
        return true;
      }

      // Check for React 19 root
      if (container._reactRootContainer) {
        container._reactRootContainer.unmount();
        return true;
      }

      // Fallback: clear container
      if (container.innerHTML !== undefined) {
        container.innerHTML = '';
        return true;
      }
    } catch (e) {
      // Silently fail
    }

    return false;
  };
}

// Also provide render polyfill if needed
if (!ReactDOM.render) {
  ReactDOM.render = function(element, container) {
    let root = rootMap.get(container);
    if (!root) {
      root = createRoot(container);
      rootMap.set(container, root);
    }
    root.render(element);
    return root;
  };
}

module.exports = ReactDOM;

