import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Pour mesurer les performances, passez une fonction à reportWebVitals
// Exemple : reportWebVitals(console.log)
// ou envoyez à un endpoint analytics. Plus d'infos : https://bit.ly/CRA-vitals
reportWebVitals();
