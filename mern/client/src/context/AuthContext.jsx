/* eslint-disable react/prop-types */
// src/contexts/AuthContext.js
import { createContext, useContext, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useDispatch } from 'react-redux';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      // Update your Redux store with user info if needed
      dispatch({
        type: 'SET_USER',
        payload: {
          email: auth.user.profile.email,
          name: auth.user.profile.name,
          token: auth.user.access_token
        }
      });
    }
  }, [auth.isAuthenticated, auth.user, dispatch]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
