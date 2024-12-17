import React from 'react';
import App from './App';
import { AuthProvider } from "react-oidc-context";
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './redux/store';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_5eR8FS7uW",
  client_id: "63a66bgm7grnairaa8mkc9ji7k",
  redirect_uri: "https://www.zerokare.info",
  response_type: "code",
  scope: "phone openid email profile",
  loadUserInfo: true,
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <AuthProvider {...cognitoAuthConfig}>
        <App />
      </AuthProvider>
    </ReduxProvider>
  </React.StrictMode>
);


