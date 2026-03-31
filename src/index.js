import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Vitrine from './Vitrine';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const path = window.location.pathname;
const isVitrine = path.startsWith('/vitrine/');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isVitrine ? <Vitrine /> : <App />}
  </React.StrictMode>
);

serviceWorkerRegistration.register();
reportWebVitals();
