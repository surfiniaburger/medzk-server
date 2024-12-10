import * as dotenv from 'dotenv';
dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is required in .env file');
}

// Test coordinates (San Francisco to Los Angeles)
const origin = "37.7749,-122.4194";
const destination = "34.0522,-118.2437";

function parseLatLng(latLngString) {
    const [lat, lng] = latLngString.split(',').map(Number);
    return {
        latLng: {
            latitude: lat,
            longitude: lng
        }
    };
}

async function testGetRoute() {
    try {
        const apiUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        
        const requestBody = {
            origin: { location: parseLatLng(origin) },
            destination: { location: parseLatLng(destination) },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
            routeModifiers: {
                avoidTolls: false,
                avoidHighways: false,
                avoidFerries: false
            },
            languageCode: 'en-US',
            units: 'IMPERIAL',
            polylineQuality: 'HIGH_QUALITY',
            polylineEncoding: 'ENCODED_POLYLINE',
            extraComputations: ['TRAFFIC_ON_POLYLINE']
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': [
                    'routes.duration',
                    'routes.distanceMeters',
                    'routes.polyline',
                    'routes.legs.polyline',
                    'routes.travelAdvisory',
                    'routes.legs.travelAdvisory'
                ].join(',')
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Routes API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        
        console.log('Route Summary:');
        console.log('-------------');
        if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            console.log(`Distance: ${(route.distanceMeters / 1609.34).toFixed(2)} miles`);
            console.log(`Duration: ${Math.round(parseInt(route.duration.replace('s', '')) / 60)} minutes`);
            
            if (route.travelAdvisory?.speedReadingIntervals) {
                console.log('\nTraffic Conditions:');
                console.log('------------------');
                route.travelAdvisory.speedReadingIntervals.forEach(interval => {
                    console.log(`- ${interval.speed} traffic from point ${interval.startPolylinePointIndex || 0} to ${interval.endPolylinePointIndex}`);
                });
            }
        }

        // Save full response for debugging
        console.log('\nFull API Response:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error("Error getting route:", error.message);
        process.exit(1);
    }
}

testGetRoute();