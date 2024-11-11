import fetch from 'node-fetch';
import logger from './logger.js';
import 'dotenv/config';


async function testAPI() {
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
  const requestBody = {
    universalAqi: true,
    location: { latitude: 37.419734, longitude: -122.0827784 },
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

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    logger.error('Error:', error);
  }
}

testAPI();
