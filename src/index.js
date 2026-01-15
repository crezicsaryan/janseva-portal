import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // <--- 1. IMPORT THIS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. WRAP YOUR APP IN BROWSER ROUTER */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
