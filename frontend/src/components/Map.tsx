import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

import {
  Capability,
  EmergencyLevel,
  // RouteInterface,
  Emergency,
  Resource,
  LatLong,
  Route,
  // GeoJSON,
  // Geometry,
  JsonDataItem,
  Leg,
  Step,
} from "../types/types.ts";
import jsonData from "../data/capabilities.json";
import { useRef, useEffect, useState } from "react";

const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY;

const START_POSITION = { lat: -31.9498342, long: 115.8578795 };

const deleteLine = (resource: Resource, map: mapboxgl.Map) => {
  if (map.getLayer(resource.id.toString())) {
    map.removeLayer(resource.id.toString());
  }
  
  if (map.getSource(resource.id.toString())) {
    map.removeSource(resource.id.toString());
  }
};

const drawLine = (resource: Resource, map: mapboxgl.Map) => {

  if (!resource.route) return;
  if (map.getSource(resource.id.toString())) {
    // @ts-ignore
    console.log("redrawing");
    map.getSource(resource.id.toString()).setData(resource.route.geojson);
  } else {
    console.log(resource.severity);
    map.addLayer({
      id: resource.id.toString(),
      type: "line",
      source: {
        type: "geojson",
        
        data: resource.route.geojson,
      },

      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": severityMap[resource.severity as EmergencyLevel] ?? "black",
        "line-width": 5,
        "line-opacity": 0.75,
      },
    });
  }
};

const capabilityToImage: Record<Capability, string> = {
  [Capability.A]: "police_car",
  [Capability.B]: "police_van",
  [Capability.C]: "motorcycle",
  [Capability.D]: "fire_truck",
  [Capability.E]: "ambulance",
};

const getRoute = async (start: LatLong, end: LatLong): Promise<Route> => {
  const requestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.long},${start.lat};${end.long},${end.lat}?steps=true&geometries=geojson&access_token=${MAPBOX_KEY}`;
  const result = await fetch(requestUrl, {
    method: "GET",
  });
  const json = await result.json();

  const [route] = json.routes;

  const geojson = {
    type: "Feature" as const,
    properties: {},
    geometry: route.geometry,
  };

  const length = route.distance;

  const legs = route.legs;

  return {
    geojson,
    length,
    legs,
    start,
    end,
    id: `${start.lat}-${start.long}:${end.lat}-${end.long}`,
  };
};

const processJsonData = (jsonData: JsonDataItem[]): Resource[] => {
  return jsonData.map((item) => ({
    ...item,
    origin_lat: item.latitude,
    origin_lon: item.longitude,
    destination_lat: null, // Set defaults for additional properties not in jsonData
    destination_lon: null,
    route: null,
    percent: null,
  }));
};

const resourcesJson: Resource[] = processJsonData(jsonData);

const emergencies: Emergency[] = [
  {
    "capability": [Capability.A, Capability.B, Capability.C, Capability.D, Capability.E],
    "location": { "latitude": -31.7387003, "longitude": 115.7672242 },
    "emergencyId": 49284656,
    "emergencyLevel": "Immediate",
    "requirements": [1, 1, 1, 1, 1],
    "offset": 19205,
    "description": "Multi-vehicle collision involving hazardous materials, with injuries reported"
    },

    {
      "capability": [Capability.A, Capability.B, Capability.C, Capability.D, Capability.E],
      "location": { "latitude": -31.8953, "longitude": 115.8747 },
      "emergencyId": 49284656,
      "emergencyLevel": "Immediate",
      "requirements": [1, 1, 1, 1, 1],
      "offset": 21205,
      "description": "Multi-vehicle collision involving hazardous materials, with injuries reported"
      },

      {
        "capability": [Capability.A, Capability.B, Capability.C, Capability.D, Capability.E],
        "location": { "latitude": -31.937724, "longitude": 115.900527 },
        "emergencyId": 49284656,
        "emergencyLevel": "Immediate",
        "requirements": [1, 1, 1, 1, 1],
        "offset": 24205,
        "description": "Multi-vehicle collision involving hazardous materials, with injuries reported"
        },
        {
          "capability": [Capability.A, Capability.B, Capability.C, Capability.D, Capability.E],
          "location": { "latitude": -31.9830103, "longitude": 115.7816722 },
          "emergencyId": 49284656,
          "emergencyLevel": "Immediate",
          "requirements": [1, 1, 1, 1, 1],
          "offset": 23205,
          "description": "Multi-vehicle collision involving hazardous materials, with injuries reported"
          },
    
    {
    "capability": [Capability.D],
    "location": { "latitude": -31.9036, "longitude": 115.913215 },
    "emergencyId": 49284657,
    "emergencyLevel": "Non-Urgent",
    "requirements": [0, 0, 0, 0, 1],
    "offset": 16500,
    "description": "Controlled burn of large fallen tree blocking secondary road"
    },
    
    {
    "capability": [Capability.C],
    "location": { "latitude": -31.948805, "longitude": 115.828462 },
    "emergencyId": 49284658,
    "emergencyLevel": "Routine",
    "requirements": [0, 1, 0, 0, 0],
    "offset": 16300,
    "description": "Lost tourist on Kings Park hiking trail needs assistance"
    },
    
    {
    "capability": [Capability.C],
    "location": { "latitude": -32.036174, "longitude": 115.755841 },
    "emergencyId": 49284659,
    "emergencyLevel": "Routine",
    "requirements": [0, 1, 0, 0, 0],
    "offset": 17300,
    "description": "Elderly man with dementia wandered away from home near Fremantle"
    },
    
    {
    "capability": [Capability.B],
    "location": { "latitude": -32.0921, "longitude": 115.849314 },
    "emergencyId": 49284660,
    "emergencyLevel": "Urgent",
    "requirements": [1, 0, 0, 0, 0],
    "offset": 12200,
    "description": "Armed robbery at a jewelry store in Rockingham, suspects are still at large"
    },
    
    {
    "capability": [Capability.C],
    "location": { "latitude": -31.980767, "longitude": 115.890935 },
    "emergencyId": 49284661,
    "emergencyLevel": "Routine",
    "requirements": [0, 1, 0, 0, 0],
    "offset": 15200,
    "description": "Minor road accident in Victoria Park, traffic direction needed"
    },
    
    {
    "capability": [Capability.D],
    "location": { "latitude": -32.022263, "longitude": 115.95512 },
    "emergencyId": 49284663,
    "emergencyLevel": "Non-Urgent",
    "requirements": [0, 0, 0, 0, 1],
    "offset": 11400,
    "description": "Cat stuck in tree in Highgate, owner requesting assistance"
    },
    
    {
    "capability": [Capability.B],
    "location": { "latitude": -31.880524, "longitude": 115.754796 },
    "emergencyId": 49284664,
    "emergencyLevel": "Urgent",
    "requirements": [1, 0, 0, 0, 0],
    "offset": 14000,
    "description": "Bank heist in Fremantle, multiple hostages involved"
    },
    
    {
    "capability": [Capability.C],
    "location": { "latitude": -31.934358, "longitude": 115.815276 },
    "emergencyId": 49284666,
    "emergencyLevel": "Routine",
    "requirements": [0, 1, 0, 0, 0],
    "offset": 8000,
    "description": "Teenagers climbing construction crane, need to be escorted down safely"
    },
    
    {
    "capability": [Capability.C],
    "location": { "latitude": -32.009152, "longitude": 115.856727 },
    "emergencyId": 49284667,
    "emergencyLevel": "Routine",
    "requirements": [0, 1, 0, 0, 0],
    "offset": 18300,
    "description": "Stranded kite surfer off coast near Scarborough, needs retrieval"
    },
    
    {
    "capability": [Capability.E],
    "location": { "latitude": -31.984809, "longitude": 115.922419 },
    "emergencyId": 49284668,
    "emergencyLevel": "Immediate",
    "requirements": [0, 0, 0, 0, 1],
    "offset": 17000,
    "description": "Multiple casualties in a nightclub fire in Perth CBD, urgent medical response required"
    },
    
    {
    "capability": [Capability.B],
    "location": { "latitude": -31.914127, "longitude": 115.842442 },
    "emergencyId": 49284670,
    "emergencyLevel": "Urgent",
    "requirements": [1, 0, 0, 0, 0],
    "offset": 16450,
    "description": "Break-in at an electronics warehouse in Osborne Park, suspects still inside"
    },
    
    {
    "capability": [Capability.B],
    "location": { "latitude": -31.818961, "longitude": 115.788924 },
    "emergencyId": 49284672,
    "emergencyLevel": "Urgent",
    "requirements": [1, 0, 0, 0, 0],
    "offset": 15450,
    "description": "Suspicious vehicle with possible explosives parked outside a government building in Joondalup"
    }
];

const severityMap: Record<EmergencyLevel, string> = {
  Immediate: "red",
  Urgent: "#ff5733", // orange
  "Non-Urgent": " #FFC300", // yellow
  Routine: "blue",
};

const capabilityMap: Record<number, string> = {
  0: "Police",
  1: "Paddy Wagon",
  2: "Highway Police Motorbike",
  3: "Fire Truck",
  4: "Ambulance",
};

const drawVehicle = (map: mapboxgl.Map, vehicle: Resource, resources: React.MutableRefObject<Resource[]>) => {
  if (map.getSource(`src_vehicle_${vehicle.id.toString()}`)) {
    // @ts-expect-error we suck
    map.getSource(`src_vehicle_${vehicle.id.toString()}`).setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [vehicle.origin_lon, vehicle.origin_lat],
      },
    });
  } else {
    // Create a new source for the vehicle
    map.addSource(`src_vehicle_${vehicle.id.toString()}`, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [vehicle.origin_lon, vehicle.origin_lat],
        },
      },
    });

    // Add a layer for the vehicle with dynamic scaling
    map.addLayer({
      id: `layer_vehicle_${vehicle.id.toString()}`,
      type: "symbol",
      source: `src_vehicle_${vehicle.id.toString()}`,
      layout: {
        "icon-image": capabilityToImage[vehicle.capability],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          0.06, // At zoom level 5, icon size is 0.06
          15,
          0.12, // At zoom level 15, icon size is 0.12
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });

    // Add event listeners for dragging
    let isDragging = false;
    let draggedVehicleId: number | null = null;

    map.on("mousedown", `layer_vehicle_${vehicle.id.toString()}`, (e) => {
      isDragging = true;
      draggedVehicleId = vehicle.id;
      map.getCanvas().style.cursor = "grabbing";
      map.dragPan.disable(); // Disable map panning while dragging a vehicle
    });

    map.on("mousemove", (e) => {
      if (!isDragging || draggedVehicleId === null) return;

      const newLngLat = e.lngLat;
      const updatedResources = resources.current.map((resource) => {
        if (resource.id === draggedVehicleId) {
          return {
            ...resource,
            origin_lon: newLngLat.lng,
            origin_lat: newLngLat.lat,
          };
        }
        return resource;
      });

      resources.current = updatedResources;

      // Update the vehicle's position
      map.getSource(`src_vehicle_${draggedVehicleId.toString()}`).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [newLngLat.lng, newLngLat.lat],
        },
      });
    });

    map.on("mouseup", () => {
      isDragging = false;
      draggedVehicleId = null;
      map.getCanvas().style.cursor = "";
      map.dragPan.enable(); // Re-enable map panning after dragging is finished
    });
  }
};




const updateResources = async (
  resources: React.MutableRefObject<Resource[]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<void> => {
  const response = await fetch("https://seeking-a-route.fly.dev/optimise", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await response.json();

  const { destinations } = json;

  const newResources = await Promise.all(
    resources.current.map(async (resource) => {
      const responseVehicle = destinations.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (destination: any) => resource.id === destination.car_id
      );

      if (!responseVehicle) {
        return {
          ...resource,
          destination_lat: null,
          destination_lon: null,
          route: null,
        };
      }

      const newVehicle = {
        ...resource,
        destination_lat: responseVehicle.emergency_lat,
        destination_lon: responseVehicle.emergency_lon,
      };
      const newRoute = await getRoute(
        {
          lat: newVehicle.origin_lat,
          long: newVehicle.origin_lon,
        },
        {
          lat: newVehicle.destination_lat,
          long: newVehicle.destination_lon,
        }
      );

      const percent =
        typeof newVehicle.percent === "number" ? newVehicle.percent : 0;
      return {
        ...newVehicle,
        route: newRoute,
        percent: percent + 0.04,
        severity: responseVehicle.severity,
      };
    })
  );

  resources.current = newResources;
};

const ensureVehicleLayerOnTop = (map, vehicleId) => {
  const vehicleLayerId = `layer_vehicle_${vehicleId}`;
  if (map.getLayer(vehicleLayerId)) {
    map.moveLayer(vehicleLayerId); // This moves the layer to the top
  }
};


const Map = () => {
  mapboxgl.accessToken = MAPBOX_KEY;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [time, setTime] = useState(0);

  const resources = useRef<Resource[]>(resourcesJson);

  const initialiseMap = () => {
    if (map.current || !mapContainer.current) return; // initialize map only once

    const currentMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [START_POSITION.long, START_POSITION.lat],
      zoom: 9,
    });

    Object.entries(capabilityToImage).forEach(([_, image]) => {
      if (currentMap.hasImage(image)) {
        return;
      }

      currentMap.loadImage(`${image}.png`, (error, image_obj) => {
        if (error) throw error;
        if (!image_obj) {
          return;
          return;
        }

        currentMap.addImage(image, image_obj);
      });
    });

    map.current = currentMap;
  };

  const setTimer = () => {
    const interval = setInterval(() => {
      setTime((prevTime) => prevTime + 1000); // Increment time every 3000ms
    }, 1000);
    return interval;
  };

  useEffect(() => {
    const newResources = resources.current.map((vehicle) => {
      // 1. How far along the path are we currently?
      // a. How long is route in total

      if (!vehicle.route) return vehicle;

      const totalLength = vehicle.route?.length;

      // b. How far along are we? (percent)
      if (typeof vehicle.percent !== "number") return vehicle;
      const currentPercent = vehicle.percent;
      const currentDistance = totalLength * currentPercent;

      // c. Which leg are we in?
      const legs = vehicle.route.legs;
      const { currentLeg } = legs.reduce<{
        currentLeg: null | Leg;
        currentDistance: number;
      }>(
        (acc, leg) => {
          if (acc.currentLeg) {
            return acc;
          }
          acc.currentDistance += leg.distance;
          if (acc.currentDistance >= currentDistance) {
            acc.currentLeg = leg;
          }
          return acc;
        },
        { currentDistance: 0, currentLeg: null }
      );

      if (currentLeg === null) {
        return vehicle;
      }

      // d. What step within this leg are we?
      const steps = currentLeg.steps;

      const { currentStep } = steps.reduce<{
        currentStep: null | Step;
        currentDistance: number;
      }>(
        (acc, step) => {
          if (acc.currentStep) {
            return acc;
          }
          if (acc.currentDistance >= currentDistance) {
            acc.currentStep = step;
          } else {
            acc.currentDistance += step.distance;
          }
          return acc;
        },
        { currentDistance: currentLeg.distance, currentStep: null }
      );

      if (currentStep === null) {
        return vehicle;
      }

      const index = Math.round(
        Math.max(Math.random() * currentStep.geometry.coordinates.length - 1, 0)
      );

      const stepCoordinate = currentStep.geometry.coordinates[index];

      vehicle.origin_lat = stepCoordinate[1];
      vehicle.origin_lon = stepCoordinate[0];

      return { ...vehicle };
    });

    resources.current = newResources;
  }, [time]);

  useEffect(() => {
    initialiseMap();

    const interval = setTimer();

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const formattedResources = resources.current.map((resource) => ({
      lat: resource.origin_lat,
      lon: resource.origin_lon,
      capability: resource.capability,
      id: resource.id,
    }));

    const formattedEmergencies = emergencies
      .map((emergency) => {
        if (time < emergency.offset) {
          return null;
        }

        return {
          lat: emergency.location.latitude,
          lon: emergency.location.longitude,
          priority: emergency.emergencyLevel,
          requirements: emergency.requirements,
          id: emergency.emergencyId,
        };
      })
      .filter((emergency) => emergency !== null);

    const payload = {
      cars: formattedResources,
      emergencies: formattedEmergencies,
    };

    resources.current.forEach((resource) => {
      // First we delete the old route
      map.current && resource.route && deleteLine(resource.route, map.current);
    });

    updateResources(resources, payload);

    emergencies.forEach((emergency) => {
      if (time >= emergency.offset && map.current) {
        new mapboxgl.Marker({
          color: severityMap[emergency.emergencyLevel as EmergencyLevel],
        })
          .setLngLat([
            emergency.location.longitude,
            emergency.location.latitude,
          ])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<h3>${emergency.emergencyLevel}</h3>
              <p>
                ${emergency.location.latitude},
                ${emergency.location.longitude} 
                </p>
                <p>
                ${emergency.description ?? ""}
                </p>
                <p>
                Required capabilities: ${JSON.stringify(
                  emergency.requirements.flatMap((value, index) => {
                    if (!value) {
                      return [];
                    }
                    return capabilityMap[index] ?? [];
                  }) ?? ""
                )}
                </p>`
            )
          )
          .addTo(map.current);
      }
    });
  }, [time]);

  resources.current.forEach((resource) => {
    // First we delete the old route
    // map.current && resource.route && deleteLine(resource, map.current);
  });

  resources.current.forEach((resource) => {
    // Then we add the new route
    map.current && resource.route && drawLine(resource, map.current);
  });

  resources.current.forEach((vehicle) => {
    map.current && drawVehicle(map.current, vehicle, resources);
    map.current && ensureVehicleLayerOnTop(map.current, vehicle.id);
  });

  console.log("rendering");

  return (
    <>
      <div
        ref={mapContainer}
        className="map-container"
        style={{ width: "100%", height: "100%" }}
      ></div>
    </>
  );
};
export default Map;
