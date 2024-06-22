import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

import {
  Capability,
  EmergencyLevel,
  RouteInterface,
  Emergency,
  Resource,
  LatLong,
  Route,
  GeoJSON,
  Geometry,
  JsonDataItem,
  Destination,
} from "../types/types.ts";
import jsonData from "../data/capabilities.json";
import { useRef, useEffect, useState } from "react";

const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY;

const START_POSITION = { lat: -31.9498342, long: 115.8578795 };
const END_POSITION = { lat: -31.7387003, long: 115.7672242 };

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

  return {
    geojson,
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
    // Add similar lines for other additional properties
  }));
};

const resourcesJson: Resource[] = processJsonData(jsonData);

const emergencies: Emergency[] = [
  {
    capability: [Capability.A],
    location: { latitude: -32, longitude: 115.9 },
    emergencyId: 1,
    emergencyLevel: EmergencyLevel.Immediate,
    requirements: [1, 0, 0, 0, 0],
    offset: 0,
  },
  {
    capability: [Capability.C],
    location: { latitude: -33, longitude: 115.9 },
    emergencyId: 2,
    emergencyLevel: EmergencyLevel.Urgent,
    requirements: [0, 0, 1, 0, 0],
    offset: 1500,
  },
  {
    capability: [Capability.E],
    location: { latitude: -31, longitude: 115.9 },
    emergencyId: 3,
    requirements: [0, 0, 0, 0, 1],
    emergencyLevel: EmergencyLevel["Non-Urgent"],
    offset: 3000,
  },
];

const drawVehicle = (map: mapboxgl.Map, vehicle: Resource) => {
  if (map.getSource(`src_vehicle_${vehicle.id.toString()}`)) {
    // @ts-expect-error setdata cbf fixing
    map.getSource(`src_vehicle_${vehicle.id.toString()}`).setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [vehicle.origin_lon, vehicle.origin_lat],
      },
    });
  } else {
    map.addSource(`src_vehicle_${vehicle.id.toString()}`, {
      type: "geojson",
      data: {
        properties: {},
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [vehicle.origin_lon, vehicle.origin_lat],
        },
      },
    });

    map.addLayer({
      id: `layer_vehicle_${vehicle.id.toString()}`,
      type: "symbol",
      source: `src_vehicle_${vehicle.id.toString()}`,
      layout: {
        "icon-image": capabilityToImage[vehicle.capability],
        "icon-size": 0.2,
      },
    });
  }
};

const updateResources = async (
  resources: React.MutableRefObject<Resource[]>,
  destinations: Destination[]
): Promise<void> => {
  const newResources = await Promise.all(
    resources.current.map(async (resource) => {
      const responseVehicle = destinations.find(
        (destination) => resource.id === destination.car_id
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

      return {
        ...newVehicle,
        route: newRoute,
      };
    })
  );

  console.log({newResources})
  resources.current = newResources
//   setResources(newResources);
};

const Map = () => {
  mapboxgl.accessToken = MAPBOX_KEY;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [time, setTime] = useState(0);

  const resources = useRef<Resource[]>( resourcesJson);

  const emergencies: Emergency[] = [
    {
      capability: [Capability.A],
      location: { latitude: -32, longitude: 115.9 },
      emergencyId: 1,
      emergencyLevel: EmergencyLevel.Immediate,
      requirements: [1, 0, 0, 0, 0],
      offset: 0,
    },
    {
      capability: [Capability.C],
      location: { latitude: -33, longitude: 115.9 },
      emergencyId: 2,
      emergencyLevel: EmergencyLevel.Urgent,
      requirements: [0, 0, 1, 0, 0],
      offset: 15000,
    },
    {
      capability: [Capability.E],
      location: { latitude: -31, longitude: 115.9 },
      emergencyId: 3,
      requirements: [0, 0, 0, 0, 1],
      emergencyLevel: EmergencyLevel["Non-Urgent"],
      offset: 6000,
    },
  ];

  const initialiseMap = () => {
    if (map.current || !mapContainer.current) return; // initialize map only once

    const currentMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [START_POSITION.long, START_POSITION.lat],
      zoom: 9,
    });

    Object.entries(capabilityToImage).forEach(([capability, image]) => {
      if (currentMap.hasImage(image)) {
        return;
      }

      currentMap.loadImage(`${image}.png`, (error, image_obj) => {
        if (error) throw error;
        if (!image_obj) {
          return;
        }

        currentMap.addImage(image, image_obj);
      });
    });

    map.current = currentMap;
  };

  const setTimer = () => {
    const interval = setInterval(() => {
      setTime((prevTime) => prevTime + 3000); // Increment time every 500ms
    }, 3000);
    return interval;
  };

  useEffect(() => {
    initialiseMap();

    const interval = setTimer();
    return () => clearInterval(interval);
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
          priority: EmergencyLevel[emergency.emergencyLevel],
          requirements: emergency.requirements,
          id: emergency.emergencyId,
        };
      })
      .filter((emergency) => emergency !== null);

    const payload = {
      cars: formattedResources,
      emergencies: formattedEmergencies,
    };

    console.log({payload, time});

    // fetch("https://seeking-a-route.fly.dev/optimise/", {
    //   body: JSON.stringify(payload),
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // })
    //   .then((res) => {
    //     console.log(res);
    //   })
    //   .catch((error) => {
    //     console.error("Error:", error);
    //   });

    const res = {
      destinations: [
        {
          car_id: 0,
          emergency_id: 0,
          car_lat: -32.411052,
          car_lon: 116.411444,
          emergency_lat: -32.111052,
          emergency_lon: 116.011444,
          time_seconds: 1995.0,
        },
        {
          car_id: 2,
          emergency_id: 0,
          car_lat: -32.411052,
          car_lon: 116.411444,
          emergency_lat: -32.111052,
          emergency_lon: 116.011444,
          time_seconds: 1652.0,
        },
        {
          car_id: 6,
          emergency_id: 1,
          car_lat: -32.411052,
          car_lon: 116.411444,

          emergency_lat: -31.983119,
          emergency_lon: 115.781367,
          time_seconds: 775.0,
        },
        {
          car_id: 1,

          emergency_id: 2,
          car_lat: -32.411052,
          car_lon: 116.411444,
          emergency_lat: -31.914221,
          emergency_lon: 115.828848,
          time_seconds: 569.0,
        },
      ],
      value: 4991.0,
    };

    updateResources(resources,  res.destinations);

    console.log("Received optimization data:", resources);

    // update resources

    emergencies.forEach((emergency) => {
      if (time === emergency.offset && map.current) {
        new mapboxgl.Marker()
          .setLngLat([
            emergency.location.longitude,
            emergency.location.latitude,
          ])
          .addTo(map.current);
      }
    });
  }, [time, emergencies]);

  routes.forEach((route) => {
    map.current && drawLine(route, map.current);
  });

  resources.current.forEach((vehicle) => {
    map.current && drawVehicle(map.current, vehicle);
  });

  console.log('rendering')

  return (
    <>
      <button
        onClick={async () => {
          if (!map.current) {
            return;
          }
          const route = await getRoute(START_POSITION, END_POSITION);
          setRoutes([route]);
        }}
      >
        Click me
      </button>
      <div
        ref={mapContainer}
        className="map-container"
        style={{ width: "100%", height: "100%" }}
      ></div>
    </>
  );
};
export default Map;
