let map3DElement = null;
      let placesService = null;


      class InteractiveMarker {
    constructor(map3DElement, place) {
        this.map3DElement = map3DElement;
        this.place = place;
        this.marker = null;
    }

    async create() {
        // Import Marker3DInteractiveElement
        const { Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
        
        // Create an instance of Marker3DInteractiveElement
        this.marker = new Marker3DInteractiveElement({
            position: {
                lat: this.place.geometry.location.lat(),
                lng: this.place.geometry.location.lng(),
                altitude: 0, // Assuming altitude is optional
            },
            label: this.place.name,
            sizePreserved: true, // Preserve marker size regardless of zoom
        });

        // Add click event listener to the marker
        this.marker.addEventListener('gmp-click', () => this.showInfoWindow());
        
        // Append the marker to the map's 3D element
        this.map3DElement.append(this.marker);
    }

    async showInfoWindow() {
        const infoWindow = document.getElementById("info-window");
        
        // Simulated fetch for additional data
        const data = await this.fetchData();
        
        // Populate and display the info window
        infoWindow.innerHTML = `
            <strong>${this.place.name}</strong><br>
            Address: ${this.place.vicinity || "Not available"}<br>
            Additional Info: ${data || "No data available"}
        `;
        infoWindow.style.display = "block";
    }

    async fetchData() {
        // Simulated data fetching with a delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Simulated info for ${this.place.name}`);
            }, 1000);
        });
    }
}

    
      async function init() {
        const { Map3DElement } = await google.maps.importLibrary("maps3d");
        map3DElement = new Map3DElement({
          center: { lat: 0, lng: 0, altitude: 16000000 },
         // Adjust as needed
        });

        //await initializeMapAndElements();
        document.body.append(map3DElement);
        initAutocomplete();
        initPlacesService();
      }
    
      async function initAutocomplete() {
        const { Autocomplete } = await google.maps.importLibrary("places");
        const autocomplete = new Autocomplete(
          document.getElementById("pac-input"),
          {
            fields: ["geometry", "name", "place_id"],
          }
        );
    
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.viewport) {
            window.alert("No viewport for input: " + place.name);
            return;
          }
          zoomToViewport(place.geometry);
        });
      }
    
      async function zoomToViewport(geometry) {
        const { AltitudeMode, Polyline3DElement } = await google.maps.importLibrary("maps3d");
        let viewport = geometry.viewport;
        let locationPoints = [
          { lat: viewport.getNorthEast().lat(), lng: viewport.getNorthEast().lng() },
          { lat: viewport.getSouthWest().lat(), lng: viewport.getNorthEast().lng() },
          { lat: viewport.getSouthWest().lat(), lng: viewport.getSouthWest().lng() },
          { lat: viewport.getNorthEast().lat(), lng: viewport.getSouthWest().lng() },
          { lat: viewport.getNorthEast().lat(), lng: viewport.getNorthEast().lng() }
        ];
    
        let locationPolyline = new Polyline3DElement({
          altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
          strokeColor: "blue",
          strokeWidth: 10,
          coordinates: locationPoints,
        });
        map3DElement.append(locationPolyline);
    
        let elevation = await getElevationForPoint(geometry.location);
        if (map3DElement) {
          map3DElement.center = { lat: geometry.location.lat(), lng: geometry.location.lng(), altitude: elevation + 50 };
          map3DElement.heading = 0;
          map3DElement.range = 1000;
          map3DElement.tilt = 65;
        }
    
        initNearbySearch(geometry.location);
        await fetchEnvironmentalData(geometry.location);
      }
    
      async function initPlacesService() {
        const { PlacesService } = await google.maps.importLibrary("places");
        placesService = new PlacesService(map3DElement);
      }
    
      async function initNearbySearch(location) {
        if (!placesService) {
          console.error("PlacesService not initialized.");
          return;
        }
    
        const request = {
          location: location,
          radius: 500, // Search within 1km
          type: [
    "chiropractor",
    "dental_clinic",
    "dentist",
    "doctor",
    "drugstore",
    "hospital",
    "massage",
    "medical_lab",
    "pharmacy",
    "physiotherapist",
    "sauna",
    "skin_care_clinic",
    "spa",
    "tanning_studio",
    "wellness_center",
    "yoga_studio"
], 
        };
    
        placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            results.forEach((place) => {
              const marker = new InteractiveMarker(map3DElement, place);
              marker.create();
            });
          } else {
            console.error("Nearby search failed: ", status);
          }
        });
      }


 
    
      function addMarker(place) {
        const { Marker3DElement } = google.maps.maps3d;
        const marker = new Marker3DElement({
          position: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            altitude: 0, // Adjust if necessary
          },
          label: place.name,
          sizePreserved: true,
        });
        map3DElement.append(marker);
      }
    
      async function getElevationForPoint(location) {
        const { ElevationService } = await google.maps.importLibrary("elevation");
        const elevatorService = new google.maps.ElevationService();
        const elevationResponse = await elevatorService.getElevationForLocations({
          locations: [location],
        });
    
        if (!(elevationResponse.results && elevationResponse.results.length)) {
          window.alert("Insufficient elevation data.");
          return 0;
        }
        return elevationResponse.results[0].elevation || 10;
      }

      async function fetchEnvironmentalData(location) {
        const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat()}&lon=${location.lng()}&appid=${window.OPENWEATHER_API_KEY}`;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat()}&lon=${location.lng()}&appid=${window.OPENWEATHER_API_KEY}`;

    try {
        const [airQualityResponse, weatherResponse] = await Promise.all([
            fetch(airQualityUrl),
            fetch(weatherUrl),
        ]);

        const airQualityData = await airQualityResponse.json();
        const weatherData = await weatherResponse.json();

        displayEnvironmentalData({ airQuality: airQualityData, weather: weatherData });
    } catch (error) {
        console.error("Failed to fetch environmental data:", error);
    }
}

function displayEnvironmentalData(data) {
    const resultsBox = document.getElementById("api-results");
    const dataList = document.getElementById("api-data-list");

    // Clear previous data
    dataList.innerHTML = "";

    // Populate new data
    dataList.innerHTML += `
        <li>Air Quality Index: ${data.airQuality.list[0].main.aqi}</li>
        <li>Weather: ${data.weather.weather[0].description}</li>
        <li>Temperature: ${(data.weather.main.temp - 273.15).toFixed(2)}°C</li>
    `;

    // Show results box
    resultsBox.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
    const draggables = document.querySelectorAll(".draggable");

    draggables.forEach((element) => {
        element.addEventListener("mousedown", (e) => {
            let shiftX = e.clientX - element.getBoundingClientRect().left;
            let shiftY = e.clientY - element.getBoundingClientRect().top;

            const moveAt = (pageX, pageY) => {
                element.style.left = pageX - shiftX + "px";
                element.style.top = pageY - shiftY + "px";
            };

            const onMouseMove = (event) => {
                moveAt(event.pageX, event.pageY);
            };

            document.addEventListener("mousemove", onMouseMove);

            element.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", onMouseMove);
                element.onmouseup = null;
            });

            // Prevent default drag-and-drop behavior
            element.ondragstart = () => false;
        });
    });
});



class Marker3DInteractiveElement {
  constructor({ position, label, iconUrl, interactive = true }) {
    this.position = position;
    this.label = label;
    this.iconUrl = iconUrl;
    this.interactive = interactive;
    this.marker = null;
  }

  async create(map3DElement) {
    const { Marker3DElement } = await google.maps.importLibrary("maps3d");
    this.marker = new Marker3DElement({
      position: this.position,
      label: this.label,
      icon: this.iconUrl,
      sizePreserved: true,
    });
    map3DElement.append(this.marker);

    if (this.interactive) {
      this.marker.addEventListener("click", () => {
        new PlaceClick().handleClick(this.position);
      });
    }
  }
}

class PlaceClick {
  handleClick(position) {
    alert(`Clicked on marker at: ${position.lat}, ${position.lng}`);
    // Fetch and display more detailed information or navigate on the map
  }
}

class Model3DElement {
  constructor({ position, modelUrl }) {
    this.position = position;
    this.modelUrl = modelUrl;
    this.model = null;
  }

  async create(map3DElement) {
    const { Model3DElement } = await google.maps.importLibrary("maps3d");
    this.model = new Model3DElement({
      position: this.position,
      model: this.modelUrl,
      scale: 1,
    });
    map3DElement.append(this.model);
  }
}

async function initializeMapAndElements() {
  if (!map3DElement) {
    console.error("map3DElement is not initialized.");
    return;
  }

  const mapCenter = { lat: 40.748817, lng: -73.985428 }; // Example location

  try {
    // Add an interactive marker
    const interactiveMarker = new google.maps.maps3d.Marker3DInteractiveElement({
      position: mapCenter,
      label: "Empire State Building",
    });

    interactiveMarker.addEventListener("gmp-click", () => {
      alert("Clicked on: Empire State Building");
    });

    map3DElement.append(interactiveMarker);

    // Add a 3D model
    const model = new google.maps.maps3d.Model3DElement({
      position: mapCenter,
      src: "https://www.3dpea.com/printable-detail/Uploads files 2922141 Groot Final-47Rac9",
      scale: 1.0, // Adjust as needed
    });

    map3DElement.append(model);
  } catch (error) {
    console.error("Failed to initialize map and elements:", error);
  }
}   
      init();