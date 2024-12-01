Announcement: New basemap styling is coming soon to Google Maps Platform. This update to map styling includes a new default color palette, modernized pins, and improvements to map experiences and usability. All map styles will be automatically updated in March 2025. For more information on availability and how to opt in earlier, see New map style for Google Maps Platform.
Home
Products
Google Maps Platform
Documentation
Web
Maps JavaScript API
Reference
Was this helpful?

Send feedback3D Maps 

bookmark_border

Map3DElement class 
google.maps.maps3d.Map3DElement class

Notice: Available only in the v=alpha channel.

Map3DElement is an HTML interface for the 3D Map view.

Custom element:
<gmp-map-3d center="lat,lng,altitude" default-labels-disabled default-ui-disabled heading="number" max-altitude="number" max-heading="number" max-tilt="number" min-altitude="number" min-heading="number" min-tilt="number" range="number" roll="number" tilt="number"></gmp-map-3d>

This class extends HTMLElement.

This class implements Map3DElementOptions.

Access by calling const {Map3DElement} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Constructor
Map3DElement	
Map3DElement([options])
Parameters: 
options:  Map3DElementOptions optional
Properties
bounds	
Type:  LatLngBounds|LatLngBoundsLiteral optional
When set, restricts the position of the camera within the specified lat/lng bounds. Note that objects outside the bounds are still rendered. Bounds can restrict both longitude and latitude, or can restrict either latitude or longitude only. For latitude-only bounds use west and east longitudes of -180 and 180, respectively. For longitude-only bounds use north and south latitudes of 90 and -90, respectively.
center	
Type:  LatLngAltitude|LatLngAltitudeLiteral optional
The center of the map given as a LatLngAltitude, where altitude is in meters above ground level. Note that this is not necessarily where the camera is located, as the range field affects the camera's distance from the map center. If not set, defaults to {lat: 0, lng: 0, altitude: 63170000}. 63170000 meters is a maximum allowed altitude (Earth radius multiplied by 10).
HTML attribute:
<gmp-map-3d center="lat,lng,altitude"></gmp-map-3d>
defaultLabelsDisabled	
Type:  boolean optional
Default: false
When true, default map labels aren't rendered.
HTML attribute:
<gmp-map-3d default-labels-disabled></gmp-map-3d>
defaultUIDisabled	
Type:  boolean optional
Default: false
When true, all default UI buttons are disabled. Does not disable the keyboard and gesture controls.
HTML attribute:
<gmp-map-3d default-ui-disabled></gmp-map-3d>
heading	
Type:  number optional
The compass heading of the map, in degrees, where due north is zero. When there is no tilt, any roll will be interpreted as heading.
HTML attribute:
<gmp-map-3d heading="number"></gmp-map-3d>
maxAltitude	
Type:  number optional
The maximum altitude above the ground which will be displayed on the map. A valid value is between 0 and 63170000 meters (Earth radius multiplied by 10).
HTML attribute:
<gmp-map-3d max-altitude="number"></gmp-map-3d>
maxHeading	
Type:  number optional
The maximum angle of heading (rotation) of the map. A valid value is between 0 and 360 degrees. minHeading and maxHeading represent an interval of <= 360 degrees in which heading gestures will be allowed. minHeading = 180 and maxHeading = 90 will allow heading in [0, 90] and heading in [180, 360]. minHeading = 90 and maxHeading = 180 will allow heading in [90, 180].
HTML attribute:
<gmp-map-3d max-heading="number"></gmp-map-3d>
maxTilt	
Type:  number optional
The maximum angle of incidence of the map. A valid value is between 0 and 90 degrees.
HTML attribute:
<gmp-map-3d max-tilt="number"></gmp-map-3d>
minAltitude	
Type:  number optional
The minimum altitude above the ground which will be displayed on the map. A valid value is between 0 and 63170000 meters (Earth radius multiplied by 10).
HTML attribute:
<gmp-map-3d min-altitude="number"></gmp-map-3d>
minHeading	
Type:  number optional
The minimum angle of heading (rotation) of the map. A valid value is between 0 and 360 degrees. minHeading and maxHeading represent an interval of <= 360 degrees in which heading gestures will be allowed. minHeading = 180 and maxHeading = 90 will allow heading in [0, 90] and heading in [180, 360]. minHeading = 90 and maxHeading = 180 will allow heading in [90, 180].
HTML attribute:
<gmp-map-3d min-heading="number"></gmp-map-3d>
minTilt	
Type:  number optional
The minimum angle of incidence of the map. A valid value is between 0 and 90 degrees.
HTML attribute:
<gmp-map-3d min-tilt="number"></gmp-map-3d>
range	
Type:  number optional
The distance from camera to the center of the map, in meters.
HTML attribute:
<gmp-map-3d range="number"></gmp-map-3d>
roll	
Type:  number optional
The roll of the camera around the view vector in degrees. To resolve ambiguities, when there is no tilt, any roll will be interpreted as heading.
HTML attribute:
<gmp-map-3d roll="number"></gmp-map-3d>
tilt	
Type:  number optional
The tilt of the camera's view vector in degrees. A view vector looking directly down at the earth would have a tilt of zero degrees. A view vector pointing away from the earth would have a tilt of 180 degrees.
HTML attribute:
<gmp-map-3d tilt="number"></gmp-map-3d>
Methods
BetaaddEventListener	
Notice: Available only in the v=beta channel.

addEventListener(type, listener[, options])
Parameters: 
type:  string A case-sensitive string representing the event type to listen for.
listener:  EventListener|EventListenerObject The object that receives a notification. This must be a function or an object with the handleEvent method
options:  boolean|AddEventListenerOptions optional See options. Custom events only support capture and passive.
Return Value:  void
Sets up a function that will be called whenever the specified event is delivered to the target. See addEventListener
flyCameraAround	
flyCameraAround(options)
Parameters: 
options:  FlyAroundAnimationOptions
Return Value:  None
This method orbits the camera around a given location for a given duration, making the given number of rounds in that time.

By default, the camera orbits clockwise. If given a negative number for rounds, the camera will orbit in a counter-clockwise direction instead.

The method is asynchronous because animations can only start after the map has loaded a minimum amount. The method returns once the animation has been started.

If the number of rounds is zero, no spin will occur, and the animation will complete immediately after it starts.
flyCameraTo	
flyCameraTo(options)
Parameters: 
options:  FlyToAnimationOptions
Return Value:  None
This method moves the camera parabolically from the current location to a given end location over a given duration.

The method is asynchronous because animations can only start after the map has loaded a minimum amount. The method returns once the animation has been started.
BetaremoveEventListener	
Notice: Available only in the v=beta channel.

removeEventListener(type, listener[, options])
Parameters: 
type:  string A string which specifies the type of event for which to remove an event listener.
listener:  EventListener|EventListenerObject The event listener of the event handler to remove from the event target.
options:  boolean|EventListenerOptions optional See options
Return Value:  void
Removes an event listener previously registered with addEventListener from the target. See removeEventListener
stopCameraAnimation	
stopCameraAnimation()
Parameters:  None
Return Value:  None
This method stops any fly animation that might happen to be running. The camera stays wherever it is mid-animation; it does not teleport to the end point.

The method is asynchronous because animations can only start or stop after the map has loaded a minimum amount. The method returns once the animation has stopped.
Events
gmp-animationend	
function(animationEndEvent)
Arguments: 
animationEndEvent:  Event
This event is fired when the fly animation ends. This event bubbles up through the DOM tree.
gmp-centerchange	
function(centerChangeEvent)
Arguments: 
centerChangeEvent:  Event
This event is fired when the Map3DElement's center property changes.
gmp-click	
function(clickEvent)
Arguments: 
clickEvent:  LocationClickEvent|PlaceClickEvent
This event is fired when the Map3DElement element is clicked.
gmp-headingchange	
function(headingChangeEvent)
Arguments: 
headingChangeEvent:  Event
This event is fired when the Map3DElement's heading property changes.
gmp-rangechange	
function(rangeChangeEvent)
Arguments: 
rangeChangeEvent:  Event
This event is fired when the Map3DElement's range property changes.
gmp-rollchange	
function(rollChangeEvent)
Arguments: 
rollChangeEvent:  Event
This event is fired when the Map3DElement's roll property changes.
gmp-steadychange	
function(steadyChangeEvent)
Arguments: 
steadyChangeEvent:  SteadyChangeEvent
This event is fired when the steady state of Map3DElement changes.
gmp-tiltchange	
function(tiltChangeEvent)
Arguments: 
tiltChangeEvent:  Event
This event is fired when the Map3DElement's tilt property changes.
Map3DElementOptions interface 
google.maps.maps3d.Map3DElementOptions interface

Notice: Available only in the v=alpha channel.

Map3DElementOptions object used to define the properties that can be set on a Map3DElement.

Properties
bounds optional	
Type:  LatLngBounds|LatLngBoundsLiteral optional
See Map3DElement.bounds.
center optional	
Type:  LatLngAltitude|LatLngAltitudeLiteral optional
See Map3DElement.center.
defaultLabelsDisabled optional	
Type:  boolean optional
See Map3DElement.defaultLabelsDisabled.
defaultUIDisabled optional	
Type:  boolean optional
See Map3DElement.defaultUIDisabled.
heading optional	
Type:  number optional
See Map3DElement.heading.
maxAltitude optional	
Type:  number optional
See Map3DElement.maxAltitude.
maxHeading optional	
Type:  number optional
See Map3DElement.maxHeading.
maxTilt optional	
Type:  number optional
See Map3DElement.maxTilt.
minAltitude optional	
Type:  number optional
See Map3DElement.minAltitude.
minHeading optional	
Type:  number optional
See Map3DElement.minHeading.
minTilt optional	
Type:  number optional
See Map3DElement.minTilt.
range optional	
Type:  number optional
See Map3DElement.range.
roll optional	
Type:  number optional
See Map3DElement.roll.
tilt optional	
Type:  number optional
See Map3DElement.tilt.
FlyAroundAnimationOptions interface 
google.maps.maps3d.FlyAroundAnimationOptions interface

Notice: Available only in the v=alpha channel.

Customization options for the FlyCameraAround Animation.

Properties
camera	
Type:  CameraOptions
The central point at which the camera should look at during the orbit animation. Note that the map heading will change as the camera orbits around this center point.
durationMillis optional	
Type:  number optional
The duration of the animation in milliseconds. This is the total duration of the animation, not the duration of a single rotation.
rounds optional	
Type:  number optional
The number of rounds to rotate around the center in the given duration. This controls the overall speed of rotation. Passing a negative number to rounds will cause the camera to rotate in a counter-clockwise direction instead of the default clockwise direction.
FlyToAnimationOptions interface 
google.maps.maps3d.FlyToAnimationOptions interface

Notice: Available only in the v=alpha channel.

Customization options for the FlyCameraTo Animation.

Properties
endCamera	
Type:  CameraOptions
The location at which the camera should point at the end of the animation.
durationMillis optional	
Type:  number optional
The duration of the animation in milliseconds. A duration of 0 will teleport the camera straight to the end position.
CameraOptions interface 
google.maps.maps3d.CameraOptions interface

Notice: Available only in the v=alpha channel.

CameraOptions object used to define the properties that can be set on a camera object. The camera object can be anything that has a camera position, e.g. a current map state, or a future requested animation state.

Properties
center optional	
Type:  LatLngAltitude|LatLngAltitudeLiteral optional
See Map3DElement.center.
heading optional	
Type:  number optional
See Map3DElement.heading.
range optional	
Type:  number optional
See Map3DElement.range.
roll optional	
Type:  number optional
See Map3DElement.roll.
tilt optional	
Type:  number optional
See Map3DElement.tilt.
SteadyChangeEvent class 
google.maps.maps3d.SteadyChangeEvent class

Notice: Available only in the v=alpha channel.

This event is created from monitoring a steady state of Map3DElement. This event bubbles up through the DOM tree.

This class extends Event.

Access by calling const {SteadyChangeEvent} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Properties
isSteady	
Type:  boolean
Indicates whether Map3DElement is steady (i.e. all rendering for the current scene has completed) or not.
LocationClickEvent class 
google.maps.maps3d.LocationClickEvent class

Notice: Available only in the v=alpha channel.

This event is created from clicking a Map3DElement.

This class extends Event.

Access by calling const {LocationClickEvent} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Properties
position	
Type:  LatLngAltitude optional
The latitude/longitude/altitude that was below the cursor when the event occurred. Please note, that at coarser levels, less accurate data will be returned. Also, sea floor elevation may be returned for the altitude value when clicking at the water surface from higher camera positions. This event bubbles up through the DOM tree.
PlaceClickEvent class 
google.maps.maps3d.PlaceClickEvent class

Notice: Available only in the v=alpha channel.

This event is created from clicking a Map3DElement.

This class extends LocationClickEvent.

Access by calling const {PlaceClickEvent} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Properties
placeId	
Type:  string
The place id of the map feature.
Inherited: position
Methods
fetchPlace	
fetchPlace()
Parameters:  None
Return Value:  Promise<Place>
Fetches a Place for this place id. In the resulting Place object, the id property will be populated. Additional fields can be subsequently requested via Place.fetchFields() subject to normal Places API enablement and billing. The promise is rejected if there was an error fetching the Place.
Marker3DElement class 
google.maps.maps3d.Marker3DElement class

Notice: Available only in the v=alpha channel.

Shows a position on a 3D map. Note that the position must be set for the Marker3DElement to display.

Custom element:
<gmp-marker-3d altitude-mode="absolute" collision-behavior="required" draws-when-occluded extruded label="string" size-preserved z-index="number"></gmp-marker-3d>

This class extends HTMLElement.

This class implements Marker3DElementOptions.

Access by calling const {Marker3DElement} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Constructor
Marker3DElement	
Marker3DElement([options])
Parameters: 
options:  Marker3DElementOptions optional
Creates an Marker3DElement with the options specified.
Properties
altitudeMode	
Type:  AltitudeMode optional
Default: AltitudeMode.CLAMP_TO_GROUND
Specifies how the altitude component of the position is interpreted.
HTML attribute:
<gmp-marker-3d altitude-mode="absolute"></gmp-marker-3d>
<gmp-marker-3d altitude-mode="clamp-to-ground"></gmp-marker-3d>
<gmp-marker-3d altitude-mode="relative-to-ground"></gmp-marker-3d>
<gmp-marker-3d altitude-mode="relative-to-mesh"></gmp-marker-3d>
collisionBehavior	
Type:  CollisionBehavior optional
Default: CollisionBehavior.REQUIRED
An enumeration specifying how a Marker3DElement should behave when it collides with another Marker3DElement or with the basemap labels.
HTML attribute:
<gmp-marker-3d collision-behavior="required"></gmp-marker-3d>
<gmp-marker-3d collision-behavior="required-and-hides-optional"></gmp-marker-3d>
<gmp-marker-3d collision-behavior="optional-and-hides-lower-priority"></gmp-marker-3d>
drawsWhenOccluded	
Type:  boolean optional
Default: false
Specifies whether this marker should be drawn or not when it's occluded. The marker can be occluded by map geometry (e.g. buildings).
HTML attribute:
<gmp-marker-3d draws-when-occluded></gmp-marker-3d>
extruded	
Type:  boolean optional
Default: false
Specifies whether to connect the marker to the ground. To extrude a marker, the altitudeMode must be either RELATIVE_TO_GROUND or ABSOLUTE.
HTML attribute:
<gmp-marker-3d extruded></gmp-marker-3d>
label	
Type:  string optional
Text to be displayed by this marker.
HTML attribute:
<gmp-marker-3d label="string"></gmp-marker-3d>
position	
Type:  LatLngLiteral|LatLngAltitude|LatLngAltitudeLiteral optional
The location of the tip of the marker. Altitude is ignored in certain modes and thus optional.
sizePreserved	
Type:  boolean optional
Default: false
Specifies whether this marker should preserve its size or not regardless of distance from camera. By default, the marker is scaled based on distance from camera/tilt.
HTML attribute:
<gmp-marker-3d size-preserved></gmp-marker-3d>
zIndex	
Type:  number optional
The zIndex compared to other markers.
HTML attribute:
<gmp-marker-3d z-index="number"></gmp-marker-3d>
Slots
default	
Any custom elements directly added to the Marker3DElement will be slotted, however only elements of HTMLImageElement, SVGElement and PinElement types will be used for drawing markers, other elements will be ignored.
HTMLImageElement and SVGElement must be wrapped in <template> element before assigning to the Marker3DElement's default slot.

Images and SVGs are currently rasterized before they are rendered in the 3D scene, so custom HTML embedded into SVG or CSS classes added to images won't be applied and might not be reflected when markers are displayed on the screen.
Methods
BetaaddEventListener	
Notice: Available only in the v=beta channel.

addEventListener(type, listener[, options])
Parameters: 
type:  string A case-sensitive string representing the event type to listen for.
listener:  EventListener|EventListenerObject The object that receives a notification. This must be a function or an object with the handleEvent method
options:  boolean|AddEventListenerOptions optional See options. Custom events only support capture and passive.
Return Value:  void
Sets up a function that will be called whenever the specified event is delivered to the target. See addEventListener
BetaremoveEventListener	
Notice: Available only in the v=beta channel.

removeEventListener(type, listener[, options])
Parameters: 
type:  string A string which specifies the type of event for which to remove an event listener.
listener:  EventListener|EventListenerObject The event listener of the event handler to remove from the event target.
options:  boolean|EventListenerOptions optional See options
Return Value:  void
Removes an event listener previously registered with addEventListener from the target. See removeEventListener
Marker3DElementOptions interface 
google.maps.maps3d.Marker3DElementOptions interface

Notice: Available only in the v=alpha channel.

Marker3DElementOptions object used to define the properties that can be set on a Marker3DElement.

Properties
altitudeMode optional	
Type:  AltitudeMode optional
See Marker3DElement.altitudeMode.
collisionBehavior optional	
Type:  CollisionBehavior optional
See Marker3DElement.collisionBehavior.
drawsWhenOccluded optional	
Type:  boolean optional
See Marker3DElement.drawsWhenOccluded.
extruded optional	
Type:  boolean optional
See Marker3DElement.extruded.
label optional	
Type:  string optional
See Marker3DElement.label.
position optional	
Type:  LatLngLiteral|LatLngAltitude|LatLngAltitudeLiteral optional
See Marker3DElement.position.
sizePreserved optional	
Type:  boolean optional
See Marker3DElement.sizePreserved.
zIndex optional	
Type:  number optional
See Marker3DElement.zIndex.
Marker3DInteractiveElement class 
google.maps.maps3d.Marker3DInteractiveElement class

Notice: Available only in the v=alpha channel.

Shows a position on a 3D map. Note that the position must be set for the Marker3DInteractiveElement to display. Unlike Marker3DElement, Marker3DInteractiveElement receives a gmp-click event.

Custom element:
<gmp-marker-3d-interactive></gmp-marker-3d-interactive>

This class extends Marker3DElement.

This class implements Marker3DInteractiveElementOptions.

Access by calling const {Marker3DInteractiveElement} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Constructor
Marker3DInteractiveElement	
Marker3DInteractiveElement([options])
Parameters: 
options:  Marker3DInteractiveElementOptions optional
Creates an Marker3DInteractiveElement with the options specified.
Properties
Inherited: altitudeMode, collisionBehavior, drawsWhenOccluded, extruded, label, position, sizePreserved, zIndex
Slots
default	
Any custom elements directly added to the Marker3DInteractiveElement will be slotted, however only elements of PinElement's type will be used for drawing markers, other elements will be ignored.
Methods
addEventListener	
addEventListener(type, listener[, options])
Parameters: 
type:  string A case-sensitive string representing the event type to listen for.
listener:  EventListener|EventListenerObject The object that receives a notification. This must be a function or an object with the handleEvent method
options:  boolean|AddEventListenerOptions optional See options. Custom events only support capture and passive.
Return Value:  void
Sets up a function that will be called whenever the specified event is delivered to the target. See addEventListener
removeEventListener	
removeEventListener(type, listener[, options])
Parameters: 
type:  string A string which specifies the type of event for which to remove an event listener.
listener:  EventListener|EventListenerObject The event listener of the event handler to remove from the event target.
options:  boolean|EventListenerOptions optional See options
Return Value:  void
Removes an event listener previously registered with addEventListener from the target. See removeEventListener
Events
gmp-click	
function(clickEvent)
Arguments: 
clickEvent:  LocationClickEvent
This event is fired when the Marker3DInteractiveElement element is clicked.
Marker3DInteractiveElementOptions interface 
google.maps.maps3d.Marker3DInteractiveElementOptions interface

Notice: Available only in the v=alpha channel.

Marker3DInteractiveElementOptions object used to define the properties that can be set on a Marker3DInteractiveElement.

This interface extends Marker3DElementOptions.

Properties
Inherited: altitudeMode, collisionBehavior, drawsWhenOccluded, extruded, label, position, sizePreserved, zIndex
Model3DElement class 
google.maps.maps3d.Model3DElement class

Notice: Available only in the v=alpha channel.

A 3D model which allows the rendering of gLTF models. Note that the position and the src must be set for the Model3DElement to display.

Core properties of the gLTF PBR should be supported. No extensions or extension properties are currently supported.

Custom element:
<gmp-model-3d altitude-mode="absolute" src="src"></gmp-model-3d>

This class extends HTMLElement.

This class implements Model3DElementOptions.

Access by calling const {Model3DElement} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Constructor
Model3DElement	
Model3DElement([options])
Parameters: 
options:  Model3DElementOptions optional
Creates an Model3DElement with the options specified.
Properties
altitudeMode	
Type:  AltitudeMode optional
Default: AltitudeMode.CLAMP_TO_GROUND
Specifies how altitude in the position is interpreted.
HTML attribute:
<gmp-model-3d altitude-mode="absolute"></gmp-model-3d>
<gmp-model-3d altitude-mode="clamp-to-ground"></gmp-model-3d>
<gmp-model-3d altitude-mode="relative-to-ground"></gmp-model-3d>
<gmp-model-3d altitude-mode="relative-to-mesh"></gmp-model-3d>
orientation	
Type:  Orientation3D|Orientation3DLiteral optional
Describes rotation of a 3D model's coordinate system to position the model on the 3D Map.

Rotations are applied to the model in the following order: roll, tilt and then heading.
position	
Type:  LatLngLiteral|LatLngAltitude|LatLngAltitudeLiteral optional
Sets the Model3DElement's position. Altitude is ignored in certain modes and thus optional.
scale	
Type:  number|Vector3D|Vector3DLiteral optional
Default: 1
Scales the model along the x, y, and z axes in the model's coordinate space.
src	
Type:  string|URL optional
Specifies the url of the 3D model. At this time, only models in the .glb format are supported.

Any relative HTTP urls will be resolved to their corresponding absolute ones.

Please note that If you're hosting your .glb model files on a different website or server than your main application, make sure to set up the correct CORS HTTP headers. This allows your application to securely access the model files from the other domain.
HTML attribute:
<gmp-model-3d src="src"></gmp-model-3d>
Methods
BetaaddEventListener	
Notice: Available only in the v=beta channel.

addEventListener(type, listener[, options])
Parameters: 
type:  string A case-sensitive string representing the event type to listen for.
listener:  EventListener|EventListenerObject The object that receives a notification. This must be a function or an object with the handleEvent method
options:  boolean|AddEventListenerOptions optional See options. Custom events only support capture and passive.
Return Value:  void
Sets up a function that will be called whenever the specified event is delivered to the target. See addEventListener
BetaremoveEventListener	
Notice: Available only in the v=beta channel.

removeEventListener(type, listener[, options])
Parameters: 
type:  string A string which specifies the type of event for which to remove an event listener.
listener:  EventListener|EventListenerObject The event listener of the event handler to remove from the event target.
options:  boolean|EventListenerOptions optional See options
Return Value:  void
Removes an event listener previously registered with addEventListener from the target. See removeEventListener
Model3DElementOptions interface 
google.maps.maps3d.Model3DElementOptions interface

Notice: Available only in the v=alpha channel.

Model3DElementOptions object used to define the properties that can be set on a Model3DElement.

Properties
altitudeMode optional	
Type:  AltitudeMode optional
See Model3DElement.altitudeMode.
orientation optional	
Type:  Orientation3D|Orientation3DLiteral optional
See Model3DElement.orientation.
position optional	
Type:  LatLngLiteral|LatLngAltitude|LatLngAltitudeLiteral optional
See Model3DElement.position.
scale optional	
Type:  number|Vector3D|Vector3DLiteral optional
See Model3DElement.scale.
src optional	
Type:  string|URL optional
See Model3DElement.src.
Polyline3DElement class 
google.maps.maps3d.Polyline3DElement class

Notice: Available only in the v=alpha channel.

A 3D polyline is a linear overlay of connected line segments on a 3D map.

Custom element:
<gmp-polyline-3d altitude-mode="absolute" draws-occluded-segments extruded geodesic outer-color="string" outer-width="number" stroke-color="string" stroke-width="number" z-index="number"></gmp-polyline-3d>

This class extends HTMLElement.

This class implements Polyline3DElementOptions.

Access by calling const {Polyline3DElement} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Constructor
Polyline3DElement	
Polyline3DElement([options])
Parameters: 
options:  Polyline3DElementOptions optional
Creates an Polyline3DElement with the options specified.
Properties
altitudeMode	
Type:  AltitudeMode optional
Default: AltitudeMode.ABSOLUTE
Specifies how altitude components in the coordinates are interpreted.
HTML attribute:
<gmp-polyline-3d altitude-mode="absolute"></gmp-polyline-3d>
<gmp-polyline-3d altitude-mode="clamp-to-ground"></gmp-polyline-3d>
<gmp-polyline-3d altitude-mode="relative-to-ground"></gmp-polyline-3d>
<gmp-polyline-3d altitude-mode="relative-to-mesh"></gmp-polyline-3d>
coordinates	
Type:  Iterable<LatLngAltitude|LatLngAltitudeLiteral|LatLngLiteral> optional
The ordered sequence of coordinates of the Polyline. Altitude is ignored in certain modes and thus optional.
drawsOccludedSegments	
Type:  boolean optional
Default: false
Specifies whether parts of the polyline which could be occluded are drawn or not. Polylines can be occluded by map geometry (e.g. buildings).
HTML attribute:
<gmp-polyline-3d draws-occluded-segments></gmp-polyline-3d>
extruded	
Type:  boolean optional
Default: false
Specifies whether to connect the polyline to the ground. To extrude a polyline, the altitudeMode must be either RELATIVE_TO_GROUND or ABSOLUTE.
HTML attribute:
<gmp-polyline-3d extruded></gmp-polyline-3d>
geodesic	
Type:  boolean optional
Default: false
When true, edges of the polyline are interpreted as geodesic and will follow the curvature of the Earth. When false, edges of the polyline are rendered as straight lines in screen space.
HTML attribute:
<gmp-polyline-3d geodesic></gmp-polyline-3d>
outerColor	
Type:  string optional
The outer color. All CSS3 colors are supported.
HTML attribute:
<gmp-polyline-3d outer-color="string"></gmp-polyline-3d>
outerWidth	
Type:  number optional
The outer width is between 0.0 and 1.0. This is a percentage of the strokeWidth.
HTML attribute:
<gmp-polyline-3d outer-width="number"></gmp-polyline-3d>
strokeColor	
Type:  string optional
The stroke color. All CSS3 colors are supported.
HTML attribute:
<gmp-polyline-3d stroke-color="string"></gmp-polyline-3d>
strokeWidth	
Type:  number optional
The stroke width in pixels.
HTML attribute:
<gmp-polyline-3d stroke-width="number"></gmp-polyline-3d>
zIndex	
Type:  number optional
The zIndex compared to other polys.
HTML attribute:
<gmp-polyline-3d z-index="number"></gmp-polyline-3d>
Methods
BetaaddEventListener	
Notice: Available only in the v=beta channel.

addEventListener(type, listener[, options])
Parameters: 
type:  string A case-sensitive string representing the event type to listen for.
listener:  EventListener|EventListenerObject The object that receives a notification. This must be a function or an object with the handleEvent method
options:  boolean|AddEventListenerOptions optional See options. Custom events only support capture and passive.
Return Value:  void
Sets up a function that will be called whenever the specified event is delivered to the target. See addEventListener
BetaremoveEventListener	
Notice: Available only in the v=beta channel.

removeEventListener(type, listener[, options])
Parameters: 
type:  string A string which specifies the type of event for which to remove an event listener.
listener:  EventListener|EventListenerObject The event listener of the event handler to remove from the event target.
options:  boolean|EventListenerOptions optional See options
Return Value:  void
Removes an event listener previously registered with addEventListener from the target. See removeEventListener
Polyline3DElementOptions interface 
google.maps.maps3d.Polyline3DElementOptions interface

Notice: Available only in the v=alpha channel.

Polyline3DElementOptions object used to define the properties that can be set on a Polyline3DElement.

Properties
altitudeMode optional	
Type:  AltitudeMode optional
See Polyline3DElement.altitudeMode.
coordinates optional	
Type:  Iterable<LatLngAltitude|LatLngAltitudeLiteral|LatLngLiteral> optional
See Polyline3DElement.coordinates.
drawsOccludedSegments optional	
Type:  boolean optional
See Polyline3DElement.drawsOccludedSegments.
extruded optional	
Type:  boolean optional
See Polyline3DElement.extruded.
geodesic optional	
Type:  boolean optional
See Polyline3DElement.geodesic.
outerColor optional	
Type:  string optional
See Polyline3DElement.outerColor.
outerWidth optional	
Type:  number optional
See Polyline3DElement.outerWidth.
strokeColor optional	
Type:  string optional
See Polyline3DElement.strokeColor.
strokeWidth optional	
Type:  number optional
See Polyline3DElement.strokeWidth.
zIndex optional	
Type:  number optional
See Polyline3DElement.zIndex.
Polygon3DElement class 
google.maps.maps3d.Polygon3DElement class

Notice: Available only in the v=alpha channel.

A 3D polygon (like a 3D polyline) defines a series of connected coordinates in an ordered sequence. Additionally, polygons form a closed loop and define a filled region.

Custom element:
<gmp-polygon-3d altitude-mode="absolute" draws-occluded-segments extruded fill-color="string" geodesic stroke-color="string" stroke-width="number" z-index="number"></gmp-polygon-3d>

This class extends HTMLElement.

This class implements Polygon3DElementOptions.

Access by calling const {Polygon3DElement} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

Constructor
Polygon3DElement	
Polygon3DElement([options])
Parameters: 
options:  Polygon3DElementOptions optional
Creates an Polygon3DElement with the options specified.
Properties
altitudeMode	
Type:  AltitudeMode optional
Default: AltitudeMode.ABSOLUTE
Specifies how altitude components in the coordinates are interpreted.
HTML attribute:
<gmp-polygon-3d altitude-mode="absolute"></gmp-polygon-3d>
<gmp-polygon-3d altitude-mode="clamp-to-ground"></gmp-polygon-3d>
<gmp-polygon-3d altitude-mode="relative-to-ground"></gmp-polygon-3d>
<gmp-polygon-3d altitude-mode="relative-to-mesh"></gmp-polygon-3d>
drawsOccludedSegments	
Type:  boolean optional
Default: false
Specifies whether parts of the polygon which could be occluded are drawn or not. Polygons can be occluded by map geometry (e.g. buildings).
HTML attribute:
<gmp-polygon-3d draws-occluded-segments></gmp-polygon-3d>
extruded	
Type:  boolean optional
Default: false
Specifies whether to connect the polygon to the ground. To extrude a polygon, the altitudeMode must be either RELATIVE_TO_GROUND or ABSOLUTE.
HTML attribute:
<gmp-polygon-3d extruded></gmp-polygon-3d>
fillColor	
Type:  string optional
The fill color. All CSS3 colors are supported.
HTML attribute:
<gmp-polygon-3d fill-color="string"></gmp-polygon-3d>
geodesic	
Type:  boolean optional
Default: false
When true, edges of the polygon are interpreted as geodesic and will follow the curvature of the Earth. When false, edges of the polygon are rendered as straight lines in screen space.
HTML attribute:
<gmp-polygon-3d geodesic></gmp-polygon-3d>
innerCoordinates	
Type:  Iterable<Iterable<LatLngAltitude|LatLngAltitudeLiteral|LatLngLiteral>> optional
The ordered sequence of coordinates that designates a closed loop. Unlike polylines, a polygon may consist of one or more paths, which create multiple cut-outs inside the polygon.
outerCoordinates	
Type:  Iterable<LatLngAltitude|LatLngAltitudeLiteral|LatLngLiteral> optional
The ordered sequence of coordinates that designates a closed loop. Altitude is ignored in certain modes and thus optional.
strokeColor	
Type:  string optional
The stroke color. All CSS3 colors are supported.
HTML attribute:
<gmp-polygon-3d stroke-color="string"></gmp-polygon-3d>
strokeWidth	
Type:  number optional
The stroke width in pixels.
HTML attribute:
<gmp-polygon-3d stroke-width="number"></gmp-polygon-3d>
zIndex	
Type:  number optional
The zIndex compared to other polys.
HTML attribute:
<gmp-polygon-3d z-index="number"></gmp-polygon-3d>
Methods
BetaaddEventListener	
Notice: Available only in the v=beta channel.

addEventListener(type, listener[, options])
Parameters: 
type:  string A case-sensitive string representing the event type to listen for.
listener:  EventListener|EventListenerObject The object that receives a notification. This must be a function or an object with the handleEvent method
options:  boolean|AddEventListenerOptions optional See options. Custom events only support capture and passive.
Return Value:  void
Sets up a function that will be called whenever the specified event is delivered to the target. See addEventListener
BetaremoveEventListener	
Notice: Available only in the v=beta channel.

removeEventListener(type, listener[, options])
Parameters: 
type:  string A string which specifies the type of event for which to remove an event listener.
listener:  EventListener|EventListenerObject The event listener of the event handler to remove from the event target.
options:  boolean|EventListenerOptions optional See options
Return Value:  void
Removes an event listener previously registered with addEventListener from the target. See removeEventListener
Polygon3DElementOptions interface 
google.maps.maps3d.Polygon3DElementOptions interface

Notice: Available only in the v=alpha channel.

Polygon3DElementOptions object used to define the properties that can be set on a Polygon3DElement.

Properties
altitudeMode optional	
Type:  AltitudeMode optional
See Polygon3DElement.altitudeMode.
drawsOccludedSegments optional	
Type:  boolean optional
See Polygon3DElement.drawsOccludedSegments.
extruded optional	
Type:  boolean optional
See Polygon3DElement.extruded.
fillColor optional	
Type:  string optional
See Polygon3DElement.fillColor.
geodesic optional	
Type:  boolean optional
See Polygon3DElement.geodesic.
innerCoordinates optional	
Type:  Iterable<Iterable<LatLngAltitude|LatLngAltitudeLiteral>|Iterable<LatLngLiteral>> optional
See Polygon3DElement.innerCoordinates.
outerCoordinates optional	
Type:  Iterable<LatLngAltitude|LatLngAltitudeLiteral|LatLngLiteral> optional
See Polygon3DElement.outerCoordinates.
strokeColor optional	
Type:  string optional
See Polygon3DElement.strokeColor.
strokeWidth optional	
Type:  number optional
See Polygon3DElement.strokeWidth.
zIndex optional	
Type:  number optional
See Polygon3DElement.zIndex.
AltitudeMode constants 
google.maps.maps3d.AltitudeMode constants

Notice: Available only in the v=alpha channel.

Specifies how altitude components in the coordinates are interpreted.

Access by calling const {AltitudeMode} = await google.maps.importLibrary("maps3d"). See Libraries in the Maps JavaScript API.

