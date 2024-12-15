import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';
//import { auth } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged

const EmbeddedMap = () => {
  const auth = getAuth(); // Get the auth instance
  const [isLoading, setIsLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  const API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://zero-kare5-837262597425.us-central1.run.app'
    : 'http://localhost:5050';

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => { // Use async here
        if (user) {
          try {
            const token = await user.getIdToken(true);
            console.log("ID Token:", token);
  
            const response = await fetch(`${API_BASE}/record/map`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
                credentials: 'include'
            });
  
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch map data');
            }
  
            const data = await response.text();
            setMapUrl(data);
          } catch (err) {
            setError(err.message);
            console.error('Error fetching map:', err);
          } finally {
            setIsLoading(false); // Set loading to false after fetching, regardless of success or failure
          }
        } else {
            setMapUrl(null); // Clear mapUrl if user is not logged in
            setIsLoading(false); // Set loading to false if not logged in
        }
      });
  
      return () => unsubscribe(); // Unsubscribe from onAuthStateChanged when component unmounts
    }, [API_BASE, auth]); // API_BASE should be in the dependency array

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md p-6">
          <CardContent>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-900">
                Authentication Required
              </h2>
              <p className="text-gray-600 text-center">
                Please log in or register to view the map
              </p>
              <div className="flex flex-col gap-4">
                <Link to="/login">
                  <Button className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-lg font-medium text-gray-700">Loading map...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <p className="text-red-600 text-center">{error}</p>
              <Button 
                className="mt-4 w-full"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {mapUrl && (
        <iframe
          src={mapUrl}
          title="Interactive Map"
          className="w-full h-full border-none"
          onLoad={handleIframeLoad}
          allow="geolocation"
        />
      )}
    </div>
  );
};

export default EmbeddedMap;