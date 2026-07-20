
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './src/context/LanguageContext';
import { FirebaseProvider } from './src/context/FirebaseContext';

// Polyfill and robust fallback for window.matchMedia to prevent listener errors
if (typeof window !== 'undefined') {
  // Gracefully suppress external browser extension and system-frame environment errors
  const isExtensionError = (msg: string, err?: any) => {
    const errorStr = String(err?.message || err?.stack || err || '');
    const fullMsg = (msg + ' ' + errorStr).toLowerCase();
    return (
      fullMsg.includes('extension') ||
      fullMsg.includes('invalidated') ||
      fullMsg.includes('emit') ||
      fullMsg.includes('addlistener') ||
      fullMsg.includes('removelistener') ||
      fullMsg.includes('chrome-extension') ||
      fullMsg.includes('safari-extension') ||
      fullMsg.includes('moz-extension') ||
      fullMsg.includes('metamask') ||
      fullMsg.includes('ethereum') ||
      fullMsg.includes('web3') ||
      fullMsg.includes('wallet') ||
      fullMsg.includes('rpc')
    );
  };

  window.onerror = function(message, source, lineno, colno, error) {
    const msg = String(message || '');
    const src = String(source || '');
    if (isExtensionError(msg, error) || src.includes('chrome-extension')) {
      console.info('[Portal Sanitizer]: Gracefully suppressed external extension error context.');
      return true; // Suppress from showing in browser console error overlays
    }
    return false;
  };

  window.addEventListener('unhandledrejection', function(event) {
    const reason = event?.reason;
    const msg = reason?.message ? String(reason.message) : String(reason || '');
    if (isExtensionError(msg, reason)) {
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
        const hasAdd = typeof mql.addListener === 'function';
        const hasRemove = typeof mql.removeListener === 'function';
        if (!hasAdd || !hasRemove) {
          try {
            // Attempt object wrapper delegation to avoid strict-mode read-only assignment errors
            const mqlWrapper = Object.create(mql);
            mqlWrapper.addListener = function(cb: any) {
              if (typeof mql.addEventListener === 'function') {
                mql.addEventListener('change', cb);
              } else if (hasAdd) {
                mql.addListener.call(mql, cb);
              }
            };
            mqlWrapper.removeListener = function(cb: any) {
              if (typeof mql.removeEventListener === 'function') {
                mql.removeEventListener('change', cb);
              } else if (hasRemove) {
                mql.removeListener.call(mql, cb);
              }
            };
            return mqlWrapper;
          } catch (e) {
            // Fallback to defineProperty
            try {
              Object.defineProperty(mql, 'addListener', {
                value: function(cb: any) {
                  mql.addEventListener?.('change', cb);
                },
                writable: true,
                configurable: true
              });
              Object.defineProperty(mql, 'removeListener', {
                value: function(cb: any) {
                  mql.removeEventListener?.('change', cb);
                },
                writable: true,
                configurable: true
              });
            } catch (innerErr) {
              // Ignore silently if frozen/sealed
            }
          }
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
