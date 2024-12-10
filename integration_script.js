// Function to get user's location
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}

// Modified initNearbySearch function to accept user location
async function initNearbySearch(location) {
    if (!placesService) {
        console.error("PlacesService not initialized.");
        return;
    }

    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
    let center = new google.maps.LatLng(location.lat, location.lng); // Use provided location
    const request = {
        fields: ["displayName", "location","formattedAddress", "photos", "reviews",  "editorialSummary", "businessStatus"],
        locationRestriction: {
            center: center,
            radius: 1000, // Search within 1km
        },
        includedPrimaryTypes: ["hospital"],
        rankPreference: SearchNearbyRankPreference.POPULARITY,
        language: "en-US",
        region: "us",
        maxResultCount: 10,
    };

    try {
        const { places } = await Place.searchNearby(request);

        if (places && places.length > 0) { // Ensure there are places available
            console.log("Nearby Search Results:", places);

            places.forEach((place, index) => {
                // Check if location data is present
                if (place.location) { // Correctly access the location property
                    const lat = place.location.lat(); // Access latitude using lat() method
                    const lng = place.location.lng(); // Access longitude using lng() method
                    
                    console.log(`Location of Place ${index + 1}:`, {
                        lat: lat,
                        lng: lng
                    });

                    // Create an interactive marker for each place
                    const marker = new InteractiveMarker(map3DElement, place);
                    marker.create();
                } else {
                    console.error(`Place ${index + 1} location data is missing.`);
                }
            });
        } else {
            console.log("No results found.");
        }
    } catch (error) {
        console.error("Nearby search failed:", error);
    }
}


// Add a button to get user location
const locationButton = document.createElement('button');
locationButton.textContent = 'Use My Location';
locationButton.className = 'location-icon';
locationButton.innerHTML = `<i class="fas fa-map-marker-alt"></i>`;
document.body.appendChild(locationButton);

locationButton.addEventListener('click', async () => {
  try {
    const userLocation = await getUserLocation();
    initNearbySearch(userLocation);
  } catch (error) {
    console.error("Error getting user location:", error);
    alert("Could not get your location. Please check your browser settings.");
  }
});
