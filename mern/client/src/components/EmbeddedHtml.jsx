import { useState, useEffect } from 'react';
import { useAuth } from "react-oidc-context";
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';

const EmbeddedMap = () => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://www.server.zerokare.info'
  : 'http://localhost:5050'

  const signOutRedirect = () => {
    const clientId = "63a66bgm7grnairaa8mkc9ji7k";
    const logoutUri = "https://www.zerokare.info/logout";
    const cognitoDomain = "https://zerokare.auth.eu-north-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  useEffect(() => {
    const fetchMapData = async () => {
      if (!auth.isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching map data...');

        const response = await fetch(`${API_BASE}/record/map`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.user?.access_token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch map data');
        }

        
        // Assuming the response contains the map HTML content
        const mapContent = await response.text();
        
        // Create a blob URL from the HTML content
        const blob = new Blob([mapContent], { type: 'text/html' });
        const mapUrl = URL.createObjectURL(blob);
        setMapUrl(mapUrl);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching map:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapData();
     // Cleanup function to revoke the blob URL
     return () => {
      if (mapUrl) {
        URL.revokeObjectURL(mapUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, auth.isAuthenticated, auth.user?.access_token]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md p-6">
          <CardContent>
            <p className="text-red-600 text-center">Authentication error: {auth.error.message}</p>
            <Button 
              className="mt-4 w-full"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md p-6">
          <CardContent>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-900">
                Authentication Required
              </h2>
              <p className="text-gray-600 text-center">
                Please log in to view the map
              </p>
              <div className="flex flex-col gap-4">
                <Button 
                  className="w-full"
                  onClick={() => auth.signinRedirect()}
                >
                  Sign In
                </Button>
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

      <div className="absolute top-4 right-4 z-10">
        <Button 
          onClick={() => signOutRedirect()}
          variant="outline"
        >
          Sign Out
        </Button>
      </div>

      {mapUrl && (
        <iframe
          src={mapUrl}
          title="Interactive Map"
          style={{ width: "100%", height: "100vh", border: "none" }}
          onLoad={handleIframeLoad}
          allow="geolocation"
        />
      )}
    </div>
  );
};

export default EmbeddedMap;
