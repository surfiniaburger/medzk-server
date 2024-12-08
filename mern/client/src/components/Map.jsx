/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import Navbar from './Navbar';

const MapComponent = () => {
  const [mapHtml, setMapHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://34.49.13.123.nip.io/Zerok'
    : 'http://localhost:5050';

    const fetchMapHtml = async () => {
      try {
        // Send GET request to your /map endpoint
        const response = await fetch(`${API_BASE}/record/map`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch map data');
        }
        
        // Get HTML response from server
        const html = await response.text();
        
        // Set the HTML response to state
        setMapHtml(html);
        console.log(html)
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Fetch the map HTML when the component is mounted
    fetchMapHtml();
  }, []);

  if (loading) {
    return <div>Loading map...</div>;
  }

  if (error) {
    return <div>There was an Error: {error}</div>;
  }

  return (
    <div>
        <Navbar/>
      <h1>Map View</h1>
      <div
        dangerouslySetInnerHTML={{ __html: mapHtml }}
      />
    </div>
  );
};

export default MapComponent;
