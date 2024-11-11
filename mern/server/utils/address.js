import { Client } from '@googlemaps/google-maps-services-js'; 
import 'dotenv/config';
import logger from './logger.js';


export async function getAddressFromCoordinates(latitude, longitude) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const client = new Client({});
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat: latitude, lng: longitude },
        key: apiKey, // Replace with your actual API key
      },
    });

    if (response.data.status === "OK") {
      return response.data.results[0].formatted_address;
    } else {
      logger.error("Geocoding failed:", response.data.status);
      return null;
    }
  } catch (error) {
    logger.error("Error during reverse geocoding:", error);
    throw error;
  }
}



