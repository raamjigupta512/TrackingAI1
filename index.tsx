
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './src/context/LanguageContext';
import { FirebaseProvider } from './src/context/FirebaseContext';

// Polyfill and robust fallback for window.matchMedia to prevent listener errors
if (typeof window !== 'undefined') {
  // Gracefully suppress external browser extension errors that trigger context invalidations
  const isExtensionError = (msg: string) => {
    return (
      msg.includes('Extension context invalidated') ||
      msg.includes("Cannot read properties of undefined (reading 'emit')") ||
      msg.includes("Cannot read properties of undefined (reading 'addListener')") ||
      msg.includes('chrome-extension://')
    );
  };

  window.onerror = function(message, source, lineno, colno, error) {
    const msg = String(message || '');
    const src = String(source || '');
    if (isExtensionError(msg) || src.includes('chrome-extension')) {
      console.info('[Portal Sanitizer]: Gracefully suppressed external extension error context.');
      return true; // Suppress from showing in browser console error overlays
    }
    return false;
  };

  window.addEventListener('unhandledrejection', function(event) {
    const reason = event?.reason;
    const msg = reason?.message ? String(reason.message) : String(reason || '');
    if (isExtensionError(msg)) {
      console.info('[Portal Sanitizer]: Gracefully suppressed external extension rejection context.');
      event.preventDefault();
    }
  });

  if (!window.matchMedia) {
    window.matchMedia = function(query: string) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function() {},
        removeListener: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return false; },
      };
    } as any;
  } else {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function(query: string) {
      const mql = originalMatchMedia(query);
      if (mql) {
        if (!mql.addListener) {
          mql.addListener = function(cb: any) {
            mql.addEventListener('change', cb);
          };
        }
        if (!mql.removeListener) {
          mql.removeListener = function(cb: any) {
            mql.removeEventListener('change', cb);
          };
        }
      }
      return mql;
    } as any;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <FirebaseProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </FirebaseProvider>
    </React.StrictMode>
  );
}
