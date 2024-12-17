/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from "react-redux";
import { AuthProvider } from "react-oidc-context";
import store from "./redux/store";

const oidcConfig = {
  authority: "https://zerokare.auth.eu-north-1.amazoncognito.com",
  client_id: "63a66bgm7grnairaa8mkc9ji7k",
  redirect_uri: window.location.origin,
  scope: "openid profile email",
  response_type: "code",
};

export const AppWrapper = ({ children }) => {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <AuthProvider {...oidcConfig}>
          {children}
        </AuthProvider>
      </Provider>
    </React.StrictMode>
  );
};
