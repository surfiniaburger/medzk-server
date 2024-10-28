/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth0 } from '@auth0/auth0-react';
import ProofVerification from "./components/ProofVerification";
import Vision from "./components/vision";
import VideoUpload from "./components/VideoUpload";
import "./index.css";
import App from "./App";

// ProtectedRoute component (keep this the same)
// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Define your routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        path: "/", // Default route (can be changed)
        element: (
          <ProtectedRoute>
            <ProofVerification /> 
          </ProtectedRoute>
        ),
      },
      {
        path: "/login", // Dedicated route for login
        element: <App />, // App.jsx will render the LoginButton
      },
      {
        path: "/vision",
        element: (
          <ProtectedRoute>
            <Vision />
          </ProtectedRoute>
        ),
      },
      {
        path: "/video-upload",
        element: (
          <ProtectedRoute>
            <VideoUpload />
          </ProtectedRoute>
        ),
      },
      // ... other routes if needed
    ],
  },
]);

// Render the application using RouterProvider
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} /> 
  </React.StrictMode>
);