import { useState, useEffect } from 'react';
import { auth, authenticatedFetch } from '../firebase';
import { useNavigate } from 'react-router-dom';

function TestComponent() {
    const [testResult, setTestResult] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    
const testAuthentication = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            setTestResult("Error: No user logged in.");
            return;
        }

        const response = await authenticatedFetch('/record/health'); // Your backend endpoint

        if (response.ok) {
            const data = await response.json();
            setTestResult("Success: " + JSON.stringify(data));
        } else {
            const errorData = await response.json(); // Get error details
            setTestResult(`Error: ${response.status} - ${JSON.stringify(errorData)}`); // More detailed error
        }
    } catch (error) {
        if (error.message === 'UNAUTHORIZED') {  // Check for specific error
          setTestResult("Error: Unauthorized. Please log in.");
        } else {
          setTestResult(`Error: ${error.message}`); // Generic error handling
        }
    }
};


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                try {
                    testAuthentication();
                    const response = await authenticatedFetch('/record/health'); // Your backend endpoint

                    if (response.ok) {
                        const data = await response.json();
                        setTestResult("Success: " + JSON.stringify(data));
                    } else {
                        const errorData = await response.json();
                        setTestResult(`Error: ${response.status} - ${JSON.stringify(errorData)}`);
                    }
                } catch (error) {
                    if (error.message === 'UNAUTHORIZED') {
                        setTestResult("Error: Unauthorized. Please log in.");
                        // Consider redirecting to login if necessary
                        // For example:
                        // import { useNavigate } from 'react-router-dom';
                        
                        navigate('/login');
                    } else {
                        setTestResult(`Error: ${error.message}`);
                    }
                }
            } else {
                setTestResult('Error: No user logged in.');
            }
        });

        return () => unsubscribe(); // Clean up listener on unmount
    }, [navigate]);


    return (
        <div>
          {/* Conditionally render the button or a message */}
          {user ? (
              <button onClick={() => testAuthentication()}>Test Authentication</button> 
          ) : (
              <p>Please log in to test authentication.</p>
          )}
            {testResult && <p>{testResult}</p>}
        </div>
    );
}

export default TestComponent;

