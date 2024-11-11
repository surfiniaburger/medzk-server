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
      },
      // Add more computations for a more robust response
      extraComputations: [
        "HEALTH_RECOMMENDATIONS", 
        "DOMINANT_POLLUTANT_CONCENTRATION", 
        "POLLUTANT_CONCENTRATION", 
        "LOCAL_AQI", 
        "POLLUTANT_ADDITIONAL_INFO" 
      ],
      languageCode: "en", // You can specify the language
      universalAqi: true, // Include Universal AQI
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
