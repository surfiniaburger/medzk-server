import axios from 'axios';
import logger from './logger.js'; 

// Initialize Google Generative AI
const gkey = process.env.GOOGLE_MAPS_API_KEY || null;
if (!gkey) {
  logger.error('Google Map API key is not valid or not found in the config.env file');
} else {
  logger.info('Google Map API key loaded successfully:');
}

export async function getAirQuality(latitude, longitude) {
  try {
    const requestBody = {
      location: {
        latitude: latitude,
        longitude: longitude,
      }
    };

    const response = await axios.post(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${gkey}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const airQualityData = response.data;
    return airQualityData; 

  } catch (error) {
    console.error('Error fetching air quality data:', error);
    throw error; 
  }
}
