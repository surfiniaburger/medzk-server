// src/components/LogoutButton.jsx
import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
  const { logout, isAuthenticated } = useAuth0(); // Get isAuthenticated

  // Only render the button if authenticated
  return isAuthenticated ? ( 
    <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
      Log Out
    </button>
  ) : null; // Or render something else while not authenticated
};


export default LogoutButton;
