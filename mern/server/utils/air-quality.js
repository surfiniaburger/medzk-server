import fetch from 'node-fetch';
import logger from './logger.js';
import 'dotenv/config';

export async function fetchAirQuality(latitude, longitude) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Define fallback coordinates
  const fallbackCoordinates = { latitude: 37.419734, longitude: -122.0827784 };

  // Fallback logic: Use provided or fallback coordinates
  const coordinates = latitude && longitude ? { latitude, longitude } : fallbackCoordinates;

  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
  const requestBody = {
    universalAqi: true,
    location: coordinates, // Use determined coordinates
    extraComputations: [
      "HEALTH_RECOMMENDATIONS",
      "DOMINANT_POLLUTANT_CONCENTRATION",
      "POLLUTANT_CONCENTRATION",
      "LOCAL_AQI",
      "POLLUTANT_ADDITIONAL_INFO",
    ],
    languageCode: "en",
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Handle non-successful responses
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Response:', data);
    return data; // Return the data for further use
  } catch (error) {
    logger.error('Error fetching air quality data:', error);
    throw error; // Re-throw the error for handling by the caller
  }
}
