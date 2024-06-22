import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";
import { Capability, EmergencyLevel, Emergency } from "../types/types.ts";

import { useRef, useEffect, useState } from "react";

const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY;
type LatLong = { lat: number; long: number };

const START_POSITION = { lat: -31.9498342, long: 115.8578795 };
const END_POSITION = { lat: -31.7387003, long: 115.7672242 };

const getRoute = async (start: LatLong, end: LatLong, map: mapboxgl.Map) => {
  const requestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.long},${start.lat};${end.long},${end.lat}?steps=true&geometries=geojson&access_token=${MAPBOX_KEY}`;
  const result = await fetch(requestUrl, {
    method: "GET",
  });
  const json = await result.json();

  const [route] = json.routes;

  const geojson = {
    type: "Feature",
    properties: {},
    geometry: route.geometry,
  };

  if (map.getSource("route")) {
    // @ts-ignore
    map.getSource("route").setData(geojson);
  } else {
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        // @ts-ignore
        data: geojson,
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

type VehicleState = {
  vehicleId: number;
  location: LatLong;
  destination: LatLong;
  
};

const Map = () => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY as string;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [time, setTime] = useState(0);

  const [vehicleStates, setVehicleStates] = useState<VehicleState[]>([]);


  
  const emergencies: Emergency[] = [
    {
      capability: [Capability.A],
      location: { latitude: -32, longitude: 115.9 },
      emergencyId: 1,
      emergencyLevel: EmergencyLevel.Immediate,
      offset: 0,
    },
    {
      capability: [Capability.C],
      location: { latitude: -33, longitude: 115.9 },
      emergencyId: 2,
      emergencyLevel: EmergencyLevel.Urgent,
      offset: 1500,
    },
    {
      capability: [Capability.E],
      location: { latitude: -31, longitude: 115.9 },
      emergencyId: 3,
      emergencyLevel: EmergencyLevel.NonUrgent,
      offset: 3000,
    },
  ];

  const initialiseMap = () => {
    if (map.current || !mapContainer.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [START_POSITION.long, START_POSITION.lat],
      zoom: 9,
    });
  };

  const setTimer = () => {
    const interval = setInterval(() => {
      setTime((prevTime) => prevTime + 500); // Increment time every 500ms
    }, 500);
    return interval;
  };

  useEffect(() => {
    initialiseMap();
    const interval = setTimer();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current) return;



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

  return (
    <>
      <button
        onClick={() =>
          map.current && getRoute(START_POSITION, END_POSITION, map.current)
        }
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
