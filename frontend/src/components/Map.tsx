import mapboxgl from 'mapbox-gl';
import './Map.css';
import React, { useRef, useEffect, useState } from 'react';

const Map = () => {
	mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY as string;

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-70.9);
    const [lat, setLat] = useState(42.35);
    const [zoom, setZoom] = useState(9);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: zoom
        });
    }, []);


	return (
		<div>
			<div
				ref={mapContainer}
				className="map-container"
				style={{ width: '100%', height: '100%' }}
			/>
		</div>
	);
};

export default Map;
