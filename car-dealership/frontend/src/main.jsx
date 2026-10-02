import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { CompareProvider } from './context/CompareContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
