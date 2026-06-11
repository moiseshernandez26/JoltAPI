import React from 'react';
import { MainView } from './views/MainView';

/**
 * Top-level application component.
 * Renders the MainView and initializes global state.
 */
export const App: React.FC = () => {
  return <MainView />;
};
