import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet
} from "react-router-dom";
import Vision from "./components/vision";
import VideoUpload from "./components/VideoUpload";
import "./index.css";
import App from "./App";
import ProofVerification from "./components/ProofVerification";
import AdvancedAnalyticsDashboard from "./components/Analytics";
import PredictForm from "./components/Predict";
import EmbeddedHtml from "./components/EmbeddedHtml";
import ChromeNano from "./components/ChromeNano";
import Environment from "./components/environment";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import SocialHtml from "./components/Social";
// Import auth from firebase.js instead of initializing here
import { Provider } from "react-redux";
import store from "./redux/store";

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
        path: "/map",
        element: <EmbeddedHtml />,
      },
      {
        path: "/chrome-canary",
        element: <ChromeNano />,
      },
      {
        path: "/environment",
        element: <Environment />,
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
