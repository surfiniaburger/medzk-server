/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from "react-redux";
import { AuthProvider } from "react-oidc-context";
import store from "./redux/store";

const oidcConfig = {
    authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_5eR8FS7uW",
    client_id: "63a66bgm7grnairaa8mkc9ji7k",
    redirect_uri: window.location.origin, // This will automatically use zerokare.info in production
    scope: "openid phone email",
    response_type: "code",
    loadUserInfo: true,
    onSigninCallback: () => {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      )
    }
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
