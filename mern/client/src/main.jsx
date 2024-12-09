import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet
} from "react-router-dom";
//import ProofVerification from "./components/ProofVerification";
import Vision from "./components/vision";
import VideoUpload from "./components/VideoUpload";
import "./index.css";
import App from "./App";

import ProofVerification from "./components/ProofVerification";
import AdvancedAnalyticsDashboard from "./components/Analytics";
import PredictForm from "./components/Predict";
//import MapComponent from "./components/Map";
import EmbeddedHtml from "./components/EmbeddedHtml";
import ChromeNano from "./components/ChromeNano";
import Environment from "./components/environment";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import SocialHtml from "./components/Social";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// eslint-disable-next-line react/prop-types



// Initialize Firebase at the app level
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Create a context to share Firebase throughout your app
export const FirebaseContext = React.createContext(null);



// Define routes without authentication
const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        path: "/", 
        element: <App />, 
      },
      {
        path: "/predict", 
        element: (
         
            <PredictForm />
        
        ), 
      },
      {
        path: "/vision",
        element: <Vision />,
      },
      {
        path: "/video-upload",
        element: <VideoUpload />,
      },
      {
        path: "/proof-verification",
        element: <ProofVerification />,
      },
      
      {
        path: "/analytics",
        element: <AdvancedAnalyticsDashboard />,
      },
      {
        path: "/map",
        element: <EmbeddedHtml />,
      },
      {
        path: "/chrome-canary",
        element: <ChromeNano />,
      },
      {
        path: "/environment",
        element: 
         
            <Environment />,
      },
      {
        path: "/login",
        element: <LoginForm />,
      },
      {
        path: "/register",
        element: <RegisterForm />,
      },
      {
        path: "/social",
        element: <SocialHtml />,
      },
    ],
  },
]);

// Wrap your RouterProvider with FirebaseContext.Provider
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FirebaseContext.Provider value={{ app, auth }}>
      <RouterProvider router={router} />
    </FirebaseContext.Provider>
  </React.StrictMode>
);