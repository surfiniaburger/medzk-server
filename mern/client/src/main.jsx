import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
//import ProofVerification from "./components/ProofVerification";
import Vision from "./components/vision";
import VideoUpload from "./components/VideoUpload";
import "./index.css";
import App from "./App";

import ProofVerification from "./components/ProofVerification";
import AdvancedAnalyticsDashboard from "./components/Analytics";
import PredictForm from "./components/Predict";
import GenderEquityDashboard from "./components/equality";

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
        element: <PredictForm />, 
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
        path: "/equity",
        element: <GenderEquityDashboard />,
      },
    ],
  },
]);

// Render application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
