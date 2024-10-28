// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom'; // Keep BrowserRouter here
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      audience="YOUR_API_IDENTIFIER"
    >
      <BrowserRouter> {/* BrowserRouter remains in index.jsx */}
        <App /> 
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);

