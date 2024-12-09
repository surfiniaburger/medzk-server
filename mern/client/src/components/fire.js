import { auth, authenticatedFetch } from '../firebase'; // Import your functions

const testAuthentication = async () => {
  try {
    const user = auth.currentUser; 
    if (!user) {
      console.error("No user is currently logged in.");
      // Optionally, redirect to login here if needed
      return;
    }

    // This is a simple test fetch; replace '/test' with an actual protected endpoint on your backend
    const response = await authenticatedFetch('/test');  

    if (response.ok) {
      const data = await response.json();
      console.log('Authentication successful!', data);
    } else {
      const errorData = await response.json(); // Attempt to get error details from response
      console.error('Authentication failed:', response.status, errorData);
      // Handle the error (e.g., display an error message, logout the user)
    }
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      console.error("User is not authenticated. Redirecting to login.");
      // Redirect to login
    } else {
      console.error("An unexpected error occurred:", error);
      // Handle other errors as appropriate
    }
  }
};

// Call the test function (e.g., when a button is clicked)
testAuthentication(); 
