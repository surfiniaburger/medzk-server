// Function to load and add a 3D model to the map at a given location
async function add3DModelToMap(map, location, modelUrl) {
  const { Model3DElement, AltitudeMode } = await google.maps.importLibrary("maps3d");

  const model = new Model3DElement({
    position: location,
    src: modelUrl,
    altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
    scale: 1 // Adjust scale as needed
  });

  map.append(model);
}

// Function to add 3D models to all hotspots
async function add3DModelsToHotspots(map, hotspots, modelUrl) {
  for (const hotspot of hotspots) {
    await add3DModelToMap(map, hotspot.markerLocation, modelUrl);
  }
}

//This function will be called after the map is initialized
async function addModelsAfterMapInit(map, hotspots, modelUrl){
    await add3DModelsToHotspots(map, hotspots, modelUrl);

  // Add 3D models after the map is initialized
  const modelUrl = "https://medzk-server.onrender.com/models/tree.glb";
  await add3DModelsToHotspots(map3DElement, hotspots, modelUrl);
}

// Replace the original initGame function
initGame = initGameWithModels;
