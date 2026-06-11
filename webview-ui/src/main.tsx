import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './global.css';

/**
 * React entry point.
 * Mounts the App component into the Webview's root div.
 */
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
