import React from 'react';
import ReactDOM from 'react-dom/client';
import { SidebarApp } from './SidebarApp';
import './global.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SidebarApp />
    </React.StrictMode>,
  );
}
