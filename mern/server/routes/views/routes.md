 --------------------Request route polylines 

bookmark_border
Note: Polylines are not supported by the Compute Route Matrix feature of the Routes API.
The computeRoutes method (REST) and the ComputeRoutes method (gRPC) both return the route represented by a polyline as part of the response. These APIs return two types of polylines:

Basic polyline (default), represents a route but without traffic information embedded in the polyline. Requests that return a basic polyline are billed at the Routes Basic rate. Learn more about billing for Routes API.

Traffic-aware polyline, contain information about the traffic conditions along the route. Traffic conditions are expressed in terms of speed categories (NORMAL, SLOW, TRAFFIC_JAM) applicable on a given interval of the polyline. Requests for traffic-aware polylines are billed at the Routes Preferred rate. Learn more about billing for Routes API. For details, see Configure polyline quality

For more on polylines, see:

Conceptual information on Polylines

Interactive Polyline Encoder Utility lets you create encoded polylines in a UI or decode polylines to display on a map. For example, use this utility to decode a polyline created by the code below.

Note: Special characters in the polylines returned by the REST API are JSON escaped. To display these polylines in the Interactive Polyline Encoder Utility you must first unescape them. There are many utilities available to perform a JSON unescape, such as Freeformatter.
Request a basic polyline for a route, leg, or step
A polyline is represented by a Polyline (REST) or Polyline (gRPC) object. You can return a polyline in the response at the route, leg, and step level.

Specify which polyline to return by using the response field mask:

At the route level, return a polyline in the response by including routes.polyline in the response field mask.

At the leg level, return a polyline in the response for each leg of the route by including routes.legs.polyline.

Note: Each leg corresponds to the trip between two waypoints when via is false for the waypoint to indicate a stop on the route. For example, a route with no intermediate waypoints has only one leg. A route that includes an intermediate waypoint with a stop has two legs. A route that includes one intermediate waypoint with via set to true has one leg.
At the step level, return a polyline in the response for each step of the leg by including routes.legs.steps.polyline.

For example, to return a polyline for the entire route, for each leg, and for each step of each leg:


curl -X POST -d '{
  "origin":{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  },
  "destination":{
    "address": "24 Willie Mays Plaza, San Francisco, CA 94107"
  },
  "travelMode": "DRIVE"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline,routes.legs.polyline,routes.legs.steps.polyline' \
'https://routes.googleapis.com/directions/v2:computeRoutes'
This request returns the following response which includes the polyline for the route, for each leg of the route, and for each step of the leg:


{
  "routes": [
    {
      "legs": [
        {
          "polyline": {
              "encodedPolyline": "ipkcFfich...@Bs@?A?O?SD{A@o@B}@I?qA?_AA_@@_@?"
          }
        },
          "steps": [
              {
                  "polyline": {
                      "encodedPolyline": "kclcF...@sC@YIOKI"
                  }
              },
              {
                  "polyline": {
                      "encodedPolyline": "wblcF~...SZSF_@?"
                  }
              },
              ...
      ],
      "distanceMeters": 56901,
      "duration": "2420s",
      "polyline": {
        "encodedPolyline": "ipkcFfich...@Bs@?A?O?SD{A@o@B}@I?qA?_AA_@@_@?"
      }
    }
  ]
}
Because this request only contains an origin and a destination, the returned route only contains a single leg. Therefore, the polyline for the leg and for the route are the same.

If you add an intermediate waypoint to the request, then the returned route contains two legs:


curl -X POST -d '{
  "origin":{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  },
  "destination":{
    "address": "24 Willie Mays Plaza, San Francisco, CA 94107"
  },
  "intermediates": [
    { "address": "450 Serra Mall, Stanford, CA 94305, USA"},
  ],
  "travelMode": "DRIVE",
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline,routes.legs.polyline' \
'https://routes.googleapis.com/directions/v2:computeRoutes'
This request returns two legs, each with a unique polyline, and a polyline for the entire route:


{
  "routes": [
    {
      "legs": [
        {
          "polyline": {
            "encodedPolyline": "kclcFfqchV?A...?I@G?GAECCCEKICBAFG"
          }
          "steps": [
            {
                "polyline": {
                    "encodedPolyline": "kclcFfqch...YIOKI"
                }
            },
        ...
        },
        {
          "polyline": {
            "encodedPolyline": "ojmcFtethV?K...QOYQOGA?_@MUG[Ga@G"
          }
          "steps": [
            {
                "polyline": {
                    "encodedPolyline": "uypeFbo`jVgJq...PoBiC"
                }
            },
        ...
        }
      ],
      "distanceMeters": 68403,
      "duration": "3759s",
      "polyline": {
          "encodedPolyline": "kclcFfqchV?A?CBKF[Ha...?GAECCCEKICBAFGJEBE"
      }
    }
  ]
}
Polyline quality
The quality of a polyline can be described in the following terms:

The floating-point precision of the points

Points are specified as latitude and longitude values, which are represented in single-precision floating-point format. This works well for small values (which can be represented precisely), but precision decreases as values increase because of floating-point rounding errors.

In computeRoutes method (REST) and ComputeRoutes, this is controlled by polylineEncoding.

The number of points that make up the polyline

The more points there are, the smoother the polyline (especially in curves).

In computeRoutes method (REST) and ComputeRoutes, this is controlled by polylineQuality.

Configure polyline encoding type
Use the polylineEncoding request option for controlling the polyline type. The polylineEncoding property controls whether the polyline will be encoded as ENCODED_POLYLINE (default), meaning the Encoded Polyline Algorithm Format will be used, or GEO_JSON_LINESTRING, meaning the GeoJSON LineString format will be used.

For example, in the request body:


curl -X POST -d '{
  "origin":{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  },
  "destination":{
    "address": "24 Willie Mays Plaza, San Francisco, CA 94107"
  },
  "travelMode": "DRIVE",
  "polylineEncoding": "ENCODED_POLYLINE"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline,routes.legs.polyline' \
'https://routes.googleapis.com/directions/v2:computeRoutes'
Configure Polyline quality
polylineQuality specifies the quality of the polyline as HIGH_QUALITY or OVERVIEW (default). With OVERVIEW, the polyline is composed using a small number of points and has a lower request latency than HIGH_QUALITY.

For example, in the request body:


{
  "origin":{
    "location":{
      "latLng":{
        "latitude": 37.419734,
        "longitude": -122.0827784
      }
    }
  },
  "destination":{
    "location":{
      "latLng":{
        "latitude": 37.417670,
        "longitude": -122.079595
      }
    }
  },
  "travelMode": "DRIVE",
  "routingPreference": "TRAFFIC_AWARE",
  "polylineQuality": "HIGH_QUALITY",
  "polylineEncoding": "ENCODED_POLYLINE",
  "departureTime": "2023-10-15T15:01:23.045123456Z",
  ...
}
Request a traffic-aware polyline
Caution: Requests for a traffic-aware polyline are billed at a higher rate. Learn more about billing for Routes API.
The examples shown above all return basic polylines, meaning polylines without traffic information. In addition, you can also request that the polyline contains traffic information for the route and for each leg of the route.

Note: Traffic information is not available in the polyline at the step level.
Traffic-aware polylines contain information about the traffic conditions along the route. Traffic conditions are expressed in terms of speed categories (NORMAL, SLOW, TRAFFIC_JAM) for a given interval of the response polyline. The intervals are defined by the indexes of their starting (inclusive) and ending (exclusive) polyline points.

For example, the following response shows NORMAL traffic between polyline points 2 and 4:


{
  "startPolylinePointIndex": 2,
  "endPolylinePointIndex": 4,
  "speed": "NORMAL"
}
To make a request to compute a traffic-aware polyline, set the following properties in the request:

Set the extraComputations array field to TRAFFIC_ON_POLYLINE to enable the traffic calculation.

Set the travelMode to DRIVE or TWO_WHEELER. Requests for any other travel mode return an error.

Specify either the TRAFFIC_AWARE or TRAFFIC_AWARE_OPTIMAL routing preference in the request. For more information, see Configure quality vs latency.

Set a response field mask that specifies to return the response properties:

At the route level, return all travel information in the response by including routes.travelAdvisory in the response field mask. To return just the traffic information, specify routes.travelAdvisory.speedReadingIntervals

At the leg level, return all travel information in the response for each leg of the route by including routes.legs.travelAdvisory. To return just the traffic information, specify routes.legs.travelAdvisory.speedReadingIntervals.


curl -X POST -d '{
  "origin":{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  },
  "destination":{
    "address": "24 Willie Mays Plaza, San Francisco, CA 94107"
  },
  "travelMode": "DRIVE",
  "extraComputations": ["TRAFFIC_ON_POLYLINE"],
  "routingPreference": "TRAFFIC_AWARE_OPTIMAL"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline,routes.legs.polyline,routes.travelAdvisory,routes.legs.travelAdvisory' \
'https://routes.googleapis.com/directions/v2:computeRoutes'
Example response for a traffic-aware polyline
In the response, traffic data is encoded in the polyline and is contained in the travelAdvisory field, of type RouteLegTravelAdvisory object (each leg) and RouteTravelAdvisory object (route).

For example:


{
  "routes": [
    {
      "legs": {
        "polyline": {
          "encodedPolyline": "}boeF~zbjVAg@EmB`GWHlD"
        },
        // Traffic data for the leg.
        "travelAdvisory": {
          "speedReadingIntervals": [
            {
              "endPolylinePointIndex": 1,
              "speed": "NORMAL"
            },
            {
              "startPolylinePointIndex": 1,
              "endPolylinePointIndex": 2,
              "speed": "SLOW"
            },
            {
              "startPolylinePointIndex": 2,
              "endPolylinePointIndex": 4,
              "speed": "NORMAL"
            }
          ] 
        }
      },
      "polyline": {
        "encodedPolyline": "}boeF~zbjVAg@EmB`GWHlD"
      },
      // Traffic data for the route.
      "travelAdvisory": {
        "speedReadingIntervals": [
          {
            "endPolylinePointIndex": 1,
            "speed": "NORMAL"
          },
          {
            "startPolylinePointIndex": 1,
            "endPolylinePointIndex": 2,
            "speed": "SLOW"
          },
          {
            "startPolylinePointIndex": 2,
            "endPolylinePointIndex": 4,
            "speed": "NORMAL"
          }
        ] 
      }
    }
  ]
}
Both RouteTravelAdvisory and RouteLegTravelAdvisory include an array field called speedReadingIntervals that contains traffic speed information. Each object in the array is represented by a SpeedReadingInterval (REST) or SpeedReadingInterval (gRPC) object.

A SpeedReadingInterval object includes speed reading for a route interval, such as NORMAL, SLOW, or TRAFFIC_JAM. The entire array of objects covers the entire polyline of the route without overlap. The start point of a specified interval is the same as the end point of the preceding interval.

Every interval is described by its startPolylinePointIndex, endPolylinePointIndex, and the corresponding speed category. Notice that the lack of start index within the interval corresponds with index 0 in accordance with the proto3 practices.

The startPolylinePointIndex and endPolylinePointIndex values are not always consecutive. For example:


{
  "startPolylinePointIndex": 2,
  "endPolylinePointIndex": 4,
  "speed": "NORMAL"
}
In this case, the traffic conditions were the same from index 2 to index 4.

Render traffic-aware polylines with Maps SDK
We recommend displaying traffic aware polylines on the map using the various features offered by Google Maps SDKs including custom coloring, strokes, and patterns along the polyline stretches. For more details about using polylines, see Polyline Features for Android and Polyline Features for iOS.

Example Polyline rendering
The users of Maps SDK have the opportunity of defining a customized mapping logic between the speed categories and the polyline rendering schemas. As an example, one might decide to display "NORMAL" speed as a thick blue line on the map while "SLOW" speed might be displayed as a thick orange line, for example.

The following snippets add a thick blue polyline with geodesic segments from Melbourne to Perth. For more information, see Customizing appearances (for Android) and Customize the Polyline (for iOS).------------To calculate a route, you must specify at a minimum the locations of the route origin and route destination. You define these locations as waypoints on the route.

In addition to origin and destination, you can specify different types of waypoints and how to handle waypoints for a route. For more information and examples, see these topics:

Specify vehicle heading and side of road
Specify intermediate waypoints
Set a stop along a route
Set a point for a route to pass through
Optimize the order of stops on your route
Specify locations for a route
You represent a location by creating a Waypoint (REST) or Waypoint (gRPC) object. In the waypoint definition, you can specify a location in any of the following ways:

Place ID (preferred)
Latitude/longitude coordinates
Address string ("Chicago, IL" or "Darwin, NT, Australia")
Plus Code
You can specify locations for all waypoints in a request the same way, or you can mix them. For example, you can use latitude/longitude coordinates for the origin waypoint and use a place ID for the destination waypoint.

For efficiency and accuracy, use place IDs instead of latitude/longitude coordinates or address strings. Place IDs are uniquely explicit and provide geocoding benefits for routing such as access points and traffic variables. They help avoid the following situations that can result from other ways of specifying a location:

Using latitude/longitude coordinates can result in the location being snapped to the road nearest to those coordinates - which might not be an access point to the property, or even a road that quickly or safely leads to the destination.
Address strings must first be geocoded by the Routes API to convert them to latitude/longitude coordinates before it can calculate a route. This conversion can affect performance.
Specify a location as a place ID
You can use a place ID to specify the location of a waypoint. Because latitude and longitude coordinates are snapped to roads, you might find a place ID offers better results in some circumstances.

Retrieve place IDs from the Geocoding API and the Places API (including Place Autocomplete). For more about place IDs, see the Place ID overview.

The following example uses the placeId property to pass a place ID for both the origin and destination:


{
  "origin":{
    "placeId": "ChIJayOTViHY5okRRoq2kGnGg8o"
  },
  "destination":{
    "placeId": "ChIJTYKK2G3X5okRgP7BZvPQ2FU"
  },
  ...
}
Specify a location as latitude and longitude coordinates
To define location in a waypoint, specify the Location (REST) or Location(gRPC) by using latitude/longitude coordinates.

For example, specify a waypoint for the route origin and destination using latitude and longitude coordinates:


{
  "origin":{
    "location":{
      "latLng":{
        "latitude": 37.419734,
        "longitude": -122.0827784
      }
    }
  },
  "destination":{
    "location":{
      "latLng":{
        "latitude": 37.417670,
        "longitude": -122.079595
      }
    }
  },
...
}
Note: The points specified by latitude/longitude coordinates are snapped to roads and might not provide the accuracy your app needs. Use latitude/longitude coordinates when you are confident the values truly specify the points your app needs for routing without regard to possible access points or additional geocoding details.
Specify a location as an address string
Address strings are literal addresses represented by a string (such as "1600 Amphitheatre Parkway, Mountain View, CA"). Geocoding is the process of converting an address string into latitudes and longitude coordinates (such as latitude 37.423021 and longitude -122.083739).

When you pass an address string as the location of a waypoint, Routes API internally geocodes the string to convert it to latitude and longitude coordinates.

Note: The latitude and longitude coordinates might be different from those returned by the Geocoding API. For example, Routes API might return coordinates for a building entrance rather than for its center.
For example, to calculate a route you specify a waypoint for the route origin and destination using address strings:


{
  "origin":{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  },
  "destination":{
    "address": "450 Serra Mall, Stanford, CA 94305, USA"
  },
  ...
}
In this example, the Routes API geocodes both addresses to convert them to latitude and longitude coordinates.

If the address value is ambiguous, the Routes API might invoke a search to disambiguate from similar addresses. For example, "1st Street" could be a complete value or a partial value for "1st street NE" or "1st St SE". This result may be different from that returned by the Geocoding API. You can avoid possible misinterpretations using place IDs.

Set the region for the address
If you pass an incomplete address string as the location of a waypoint, the API might use the wrong geocoded latitude/longitude coordinates. For example, you make a request specifying "Toledo" as the origin and "Madrid" as the destination for a driving route:


{
  "origin":{
    "address": "Toledo"
  },
  "destination":{
    "address": "Madrid"
  },
  "travelMode": "DRIVE"
}
In this example, "Toledo" is interpreted as a city in the state of Ohio in the United States, not in Spain. Therefore, the request returns an empty array, meaning no routes exists:


{
  []
}
You can configure the API to return results biased to a particular region by including the regionCode parameter. This parameter specifies the region code as a ccTLD ("top-level domain") two-character value. Most ccTLD codes are identical to ISO 3166-1 codes, with some notable exceptions. For example, the United Kingdom's ccTLD is "uk" (.co.uk) while its ISO 3166-1 code is "gb" (technically for the entity of "The United Kingdom of Great Britain and Northern Ireland").

A directions request for "Toledo" to "Madrid" that includes the regionCode parameter returns appropriate results because "Toledo" is interpreted as a city in Spain:


{
  "origin":{
    "address": "Toledo"
  },
  "destination":{
    "address": "Madrid"
  },
  "travelMode": "DRIVE",
  "regionCode": "es"
}
The response now contains the route calculated from Toledo, Spain to Madrid, Spain:


{
  "routes": [
    {
      "distanceMeters": 75330,
      "duration": "4137s",
      ...
    }
  ]
}
Specify a location as a Plus Code
Many people don't have a precise address, which can make it difficult for them to receive deliveries. Or, people with an address might prefer to accept deliveries at more specific locations, such as a back entrance or a loading dock.

Plus Codes are like street addresses for people or places that don't have an actual address. Instead of addresses with street names and numbers, Plus Codes are based on latitude/longitude coordinates, and are displayed as numbers and letters.

Google developed Plus Codes to give the benefit of addresses to everyone and everything. A Plus Code is an encoded location reference, derived from latitude/longitude coordinates, that represents an area: 1/8000th of a degree by 1/8000th of a degree (about 14m x 14m at the equator) or smaller. You can use Plus Codes as a replacement for street addresses in places where they don't exist or where buildings are not numbered or streets are not named.

Plus Codes must be formatted as a global code or a compound code:

A global code is composed of a 4 character area code and 6 character or longer local code.
For example, for the address "1600 Amphitheatre Parkway, Mountain View, CA", the global code is "849V" and the local code is "CWC8+R9". You then use the entire 10 character Plus Code to specify the location value as "849VCWC8+R9".

A compound code is composed of a 6 character or longer local code combined with an explicit location.
For example, the address "450 Serra Mall, Stanford, CA 94305, USA" has a local code of "CRHJ+C3". For a compound address, combine the local code with the city, state, ZIP code, and country portion of the address in the form "CRHJ+C3 Stanford, CA 94305, USA".

For example, calculate a route by specifying a waypoint for the route origin and destination using Plus Codes:


{
  "origin":{
    "address": "849VCWC8+R9"
  },
  "destination":{
    "address": "CRHJ+C3 Stanford, CA 94305, USA"
  },
  "travelMode": "DRIVE"
}
Plus Codes are supported in Google Maps Platform APIs including Place Autocomplete, Place Details, Directions API, and Geocoding API. For example, you can use Geocoding API to reverse geocoding a location specified by latitude/longitude coordinates to determine the location's Plus Code.------------hoose what information to return

bookmark_border
When you call a method to compute a route or route matrix, you must specify what information you want by listing the fields to return in the response. There is no default list of returned fields. If you omit this list, the methods return an error.

You specify the field list by creating a response field mask. You then pass the response field mask to either method by using the URL parameter $fields or fields, or by using the HTTP or gRPC header X-Goog-FieldMask.

Using a field mask is a good design practice to ensure that you don't request unnecessary data, which in turn helps to avoid unnecessary processing time and billed charges.

For more information about URL parameters, see System Parameters.

Define a response field mask
The response field mask is a comma-separated list of paths, where each path specifies a unique field in the response message. The path starts from the top-level response message and uses a dot-separated path to the specified field.

Construct and specify a field path as follows:

Find the fields that contain the information you need from the Routes API. For details, see Field References.
Determine the paths for the fields you need and construct the field masks for them: For details, see Determine what field mask you want to use.
Combine the field masks for all of the fields you need, separating the field masks with commas. For example, to request the distanceMeters for the route leg, plus the duration for each route leg step, enter them both, separated by a comma, with no spaces:


routes.legs.distanceMeters,routes.legs.steps.duration
Send the field mask with your API request. For example, in a cURL request, you would specify the field mask with -H and X-Goog-FieldMask:


-H X-Goog-FieldMask: routes.legs.distanceMeters,routes.legs.steps.duration
For examples and more details, see the following sections.
Field References
To see the fields that you can request in a response through field masks, refer to the Routes API references linked in the following list. Specify fields in camel case as shown in the reference. For example, routePreference.

In contrast, you must enter parameter values as shown. For example, for routingPreference, you must enter TRAFFIC_AWARE.
These references include the fields that are available; however, you need to refer to the hierarchy of the fields to determine the full field mask path. For details on getting the hierarchy of the fields, see Determine what field mask you want to use.

Compute route field mask
REST: Specifies the fields of the Route object in the response to return, prefixed by routes., for example, routes.distanceMeters.
gRPC: Specifies the fields of the Route object in the response to return.
Compute route matrix field masks
REST: Specifies the fields of the Response body to return.
gRPC: Specifies the fields of the RouteMatrixElement object in the response to return.
Determine what field masks to use
Here's how you can determine which fields you want to use, and construct the field masks for them:

Request all fields using a field mask of *.
Caution: While you can use this wildcard field mask while in development to determine what fields you need, don't use it in production. Requesting all fields in production results in higher costs and longer response times. Your cost may also increase unexpectedly as more advanced features are added, since this field mask will automatically include them. Instead, request only the fields you need to minimize your costs and request response time.
Look at the hierarchy of the fields in the response for the fields you want.
Construct your field masks using the hierarchy of the fields shown in the previous step, using this format:


topLevelField[.secondLevelField][.thirdLevelField][...]
Note: Don't use spaces anywhere in the list of field paths.
For example, for this partial response from a route:


"routes": [
    {
        "legs": [
            {  "steps": [
                    {"distanceMeters": 119},
                    {"distanceMeters": 41}  ]
            }
        ],
        "distanceMeters": 160
    }
]
If you want to return only the distanceMeters field for the route leg; that is, the last distanceMeters in the preceding sample, your field mask is as follows:


routes.legs.distanceMeters
If you want instead want to return the distanceMeters field for each step of the route leg; that is, the distanceMeters under steps in the preceding sample, your field mask is as follows:


routes.legs.steps.distanceMeters
If you want to return both, with the result above, your field mask is as follows:


routes.legs.distanceMeters,routes.legs.steps.distanceMeters
Example field mask paths
This section contains more examples on how to specify a field path as part of a response field mask in REST and gRPC calls.

REST call to computeRoutes
In the first example, you use a REST call to the computeRoutes method to calculate a route. In this example, in the header, you specify field masks to return the route distanceMeters and duration fields in the response. Remember to prefix the field name by routes.


X-Goog-FieldMask: routes.distanceMeters,routes.duration
REST call to computeRouteMatrix
For the REST computeRouteMatrix method used to compute a route matrix, in the header, specify to return originIndex, destinationIndex, and duration for each combination of origin and destination:


X-Goog-FieldMask: originIndex,destinationIndex,duration
gRPC call
For gRPC, set a variable containing the response field mask. You can then pass that variable to the request.


const (
  fieldMask = "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline"
)
Field path considerations
Include only the fields that you require in the response to return just the fields that you need:

Decreases processing times, so your results are returned with a lower latency.
Ensures stable latency performance. If you select all fields, or if you select all fields at the top level, you might experience performance degradation when new fields are added and then are automatically included in your response.
Results in a smaller response size, which translates into higher network throughput.
Ensures that you don't request unnecessary data, which helps to avoid unnecessary processing time and billed charges.
Note: When a response message is parsed, and a field in the response message contains its default value, the field may be omitted from the response even if you specified it in the response field mask. For more information, see the Language Guide (proto3). For example, when you compute a route matrix, the distanceMeters field of the response can contain a value of 0, its default value. Because 0 is the default value of distanceMeters, it is omitted from the response.
For more details on constructing a field mask, see the field_mask.proto.

Request a route token
To request that the Routes API returns route tokens for generated routes, follow these steps:

Set the following parameters required to return a route token:
Set travelMode to DRIVE.
Set routingPreference to TRAFFIC_AWARE or TRAFFIC_AWARE_OPTIMAL.
Check that none of your route waypoints are via waypoints.
Specify the routes.routeToken field mask to return a route token:

X-Goog-FieldMask: routes.routeToken
Note: Due to dynamic road conditions, routes generated with a given token may differ from the planned route. To minimize the differences, use the token within minutes of token generation.
You can use the route token for your planned route in the Navigation SDK. For more details, see Plan a route (Android) or Plan a route (iOS).

Route token example
Here's an example cURL request body for a single origin, single-destination route, using field masks to request a route token, along with the route duration, distance, and route polyline:


curl -X POST -d
{"origin":{
    "location": {
        "latLng":{
            "latitude":  -37.8167,
            "longitude": 144.9619
        }
    }
},
"destination":{
    "location": {
        "latLng":{
            "latitude":-37.8155,
            "longitude": 144.9663
        }
    }
},
"routingPreference":"TRAFFIC_AWARE",
"travelMode":"DRIVE"
}
-H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H X-Goog-FieldMask: routes.routeToken,routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline
'https://routes.googleapis.com/directions/v2:computeRoutes'---------------------Get a route 

bookmark_border
You can get a route using the Routes API by sending an HTTP POST request to the computeRoutes method (REST) or by calling the ComputeRoutes method (gRPC).

The following example shows the URL of a REST request to the computeRoutes method:

https://routes.googleapis.com/directions/v2:computeRoutes

Include your request options in the JSON request body. The request body contains the source and destination locations and any options that you want to set on the route. For more information, see Specify locations and Available route options.

The response contains the fields that you specified in the response field mask by using the URL parameter $fields or field information using the HTTP gRPC header X-Goog-FieldMask. For details, see Choose what information to return.

For an example of a transit route request, see Example: Get a route on transit.

Example: HTTP route request
The following code shows how to construct a request body for a computeRoutes request. In this example, you set the source and destination locations and also specify:

A travelMode of DRIVE and a traffic-aware driving route.

A language of en-US with imperial distance units.

A response field mask in the X-Goog-FieldMask header that specifies to return the following fields in the response:

routes.duration
routes.distanceMeters
routes.polyline.encodedPolyline
Note: To decode the polyline returned in the response and see the route on a map, use the decode utility at Interactive Polyline Encoder Utility.

curl -X POST -d '{
  "origin":{
    "location":{
      "latLng":{
        "latitude": 37.419734,
        "longitude": -122.0827784
      }
    }
  },
  "destination":{
    "location":{
      "latLng":{
        "latitude": 37.417670,
        "longitude": -122.079595
      }
    }
  },
  "travelMode": "DRIVE",
  "routingPreference": "TRAFFIC_AWARE",
  "computeAlternativeRoutes": false,
  "routeModifiers": {
    "avoidTolls": false,
    "avoidHighways": false,
    "avoidFerries": false
  },
  "languageCode": "en-US",
  "units": "IMPERIAL"
}' \
-H 'Content-Type: application/json' -H 'X-Goog-Api-Key: YOUR_API_KEY' \
-H 'X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline' \
'https://routes.googleapis.com/directions/v2:computeRoutes'
Example: HTTP route response body
The call above generates the following JSON response:

Note: For detailed description of the response, see Understand the compute route response.

{
  "routes": [
    {
      "distanceMeters": 772,
      "duration": "165s",
      "polyline": {
        "encodedPolyline": "ipkcFfichVnP@j@BLoFVwM{E?"
      }
    }
  ]
}