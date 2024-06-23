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

const drawLine = (route: Route, map: mapboxgl.Map) => {
  if (map.getSource(route.id)) {
    // @ts-ignore
    map.getSource(route.id).setData(route.geojson);
  } else {
    map.addLayer({
      id: route.id,
      type: "line",
      source: {
        type: "geojson",
        // @ts-ignore
        data: route.geojson,
      },

      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3887be",
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
    // Add similar lines for other additional properties
  }));
};

const resourcesJson: Resource[] = processJsonData(jsonData);

const emergencies: Emergency[] = [
  {
    capability: [Capability.A],
    location: { latitude: -32, longitude: 115.9 },
    emergencyId: 1,
    emergencyLevel: "Immediate",
    requirements: [1, 0, 0, 0, 0],
    offset: 0,
  },
  {
    capability: [Capability.C],
    location: { latitude: -33, longitude: 115.9 },
    emergencyId: 2,
    emergencyLevel: "Urgent",
    requirements: [0, 0, 1, 0, 0],
    offset: 1500,
  },
  {
    capability: [Capability.E],
    location: { latitude: -31, longitude: 115.9 },
    emergencyId: 3,
    requirements: [0, 0, 0, 0, 1],
    emergencyLevel: "Non-Urgent",
    offset: 3000,
  },
];

const severityMap: Record<EmergencyLevel, string> = {
  Immediate: "red",
  Urgent: "yellow",
  "Non-Urgent": "orange",
  Routine: "blue",
};

const drawVehicle = (map: mapboxgl.Map, vehicle: Resource) => {
  if (map.getSource(`src_vehicle_${vehicle.id.toString()}`)) {
    // Update vehicle location
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
          5, 0.06,   // At zoom level 5, icon size is 0.06
          15, 0.12   // At zoom level 15, icon size is 0.12
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
    });
  }
};

const updateResources = async (
  resources: React.MutableRefObject<Resource[]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<void> => {
  const response = await fetch("http://127.0.0.1:8000/optimise", {
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
        percent: percent + 0.01,
      };
    })
  );

  resources.current = newResources;
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
      setTime((prevTime) => prevTime + 3000); // Increment time every 3000ms
    }, 3000);
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

      const { currentStep, currentDistance: currentStepDistance } =
        steps.reduce<{
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

      const currentStepStart = Math.max(
        currentDistance - currentStepDistance,
        0
      );

      // e. What percent of the way through this step are we?
      const distanceThroughStep = currentDistance - currentStepStart;

      const stepCompletion = distanceThroughStep / currentStep.distance;

      const index = Math.round(
        Math.max(Math.random() * currentStep.geometry.coordinates.length - 1, 0)
      );
      console.log({ index, step: currentStep.geometry.coordinates });
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
          .addTo(map.current);
      }
    });
  }, [time]);

  resources.current.forEach((resource) => {
    map.current && resource.route && drawLine(resource.route, map.current);
  });

  resources.current.forEach((vehicle) => {
    map.current && drawVehicle(map.current, vehicle);
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
