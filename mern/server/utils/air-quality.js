import logger from './logger.js'; 

// Initialize Google Generative AI
const gkey = process.env.GOOGLE_MAPS_API_KEY || null;
if (!gkey) {
  logger.error('Google Map API key is not valid or not found in the config.env file');
} else {
  logger.info('Google Map API key loaded successfully:');
}

export async function fetchAirQuality(latitude, longitude) {
    const apiKey = gkey; // Replace with your actual API key
  
    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
  
    const requestBody = {
      universalAqi: true,
      location: {
        latitude: latitude,
        longitude: longitude,
      },
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Air Quality Data:', data);
      return data;
  
    } catch (error) {
      logger.error('Error fetching air quality data:', error);
      throw error;
    }
  }
  
  
  