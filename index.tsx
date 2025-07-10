
import React from 'react';
import { createRoot } from 'react-dom/client'; // Changed this line
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement); // Changed this line
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);