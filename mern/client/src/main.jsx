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
import { AuthProvider} from './context/AuthContext';
import LoginForm from "./components/LoginForm";
import { ProtectedRoute } from './components/ProtectedRoute';
import RegisterForm from "./components/RegisterForm";
// Optional: Create a ProtectedRoute component for routes that require authentication
// eslint-disable-next-line react/prop-types



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
          <ProtectedRoute>
            <PredictForm />
          </ProtectedRoute>
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
    ],
  },
]);

// Render application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
