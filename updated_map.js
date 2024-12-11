// updated_map.js

// This script handles fetching and displaying route data on the map using the Google Maps 3D API.

async function fetchRouteData(origin, destination) {
    try {
        const response = await fetch(`/record/route/${origin}/${destination}`); // Adjust API endpoint if needed
        if (!response.ok) {
            const message = `HTTP error! status: ${response.status} ${response.statusText}`;
            throw new Error(message);
        }
        const data = await response.json();
        // Validate response structure - ensure routes and polyline data exist
        if (!data.routes || !data.routes[0] || !data.routes[0].polyline || !data.routes[0].polyline.encodedPolyline) {
            throw new Error("Invalid route data received from the server.");
        }
        return data;
    } catch (error) {
        console.error('Error fetching route data:', error);
        // Handle error appropriately (e.g., display an error message to the user)
        return null; 
    }
}

async function displayRoute(map, routeData) {
    if (!routeData) {
        console.error("No route data provided.");
        return;
    }

    const route = routeData.routes[0];
    const encodedPolyline = route.polyline.encodedPolyline;

    try {
        const { Polyline3DElement, AltitudeMode } = await google.maps.importLibrary("maps3d");
        const path = google.maps.geometry.encoding.decodePath(encodedPolyline);
        const pathLatLngAlt = path.map(point => ({ lat: point.lat(), lng: point.lng(), altitude: 0 })); // Altitude can be adjusted

        const polyline = new Polyline3DElement({
            path: pathLatLngAlt,
            geodesic: true,
            strokeColor: '#FF0000', // Customize color as needed
            strokeOpacity: 1.0,
            strokeWeight: 8,
            altitudeMode: AltitudeMode.CLAMP_TO_GROUND, // Important for 3D
            map: map
        });

        map.append(polyline);

    } catch (error) {
        console.error("Error displaying route:", error);
        // Handle error (e.g., display an error message)
    }
}

// Example usage (assuming you have a map object named 'map'):
async function initRouteDisplay(map) {
    // Replace with your actual origin and destination place IDs
    const origin = "ChIJR0-w_B1Rj4AR_wK-o-oW_w0"; // Example place ID
    const destination = "ChIJ-c-o-B1Rj4AR-o-oW_w0"; // Example place ID

    const routeData = await fetchRouteData(origin, destination);
    if (routeData) {
        displayRoute(map, routeData);
    }
}

//This function should be called after the map is initialized.
//For example, within the init() function in map.html:
//initRouteDisplay(map3DElement);
