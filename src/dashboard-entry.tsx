/**
 * Point d'entrée pour la page dashboard alternative
 * Fichier séparé pour ne pas impacter index.tsx existant
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import AlternativeDashboard from './pages/AlternativeDashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AlternativeDashboard />
  </React.StrictMode>,
);

