import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";
import {
  Capability,
  Location,
  EmergencyLevel,
  Emergency,
} from "../types/types.ts";

import React, { useRef, useEffect, useState } from "react";

const Map = () => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY as string;

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(115.823148);

  const [lat, setLat] = useState(-31.940708);
  const [zoom, setZoom] = useState(9);
  const [time, setTime] = useState(0);

  const emergencies: Emergency[] = [
    {
      capability: [Capability.A],
      location: { latitude: -32, longitude: 115.9},
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
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
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
    

    // Timer to increment the time state

    console.log(time);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Check if there are any emergencies whose offset matches the current time
    emergencies.forEach((emergency) => {
      console.log(`Time: ${time}`);
      if (time === emergency.offset) {
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
    <div>
      <div
        ref={mapContainer}
        className="map-container"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default Map;
