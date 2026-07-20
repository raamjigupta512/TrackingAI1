
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './src/context/LanguageContext';
import { FirebaseProvider } from './src/context/FirebaseContext';

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
