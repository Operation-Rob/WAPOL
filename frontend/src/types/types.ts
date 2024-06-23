export interface Destination {
  car_id: number;
  emergency_id: number;
  car_lat: number;
  car_lon: number;
  emergency_lat: number;
  emergency_lon: number;
  time_seconds: number;
}

// interface ResponseData {
//   destinations: Destination[];
//   value: number;
// }

export enum Capability {
    A = 1,
    B = 2,
    C = 3,
    D = 4,
    E = 5,
  }
  
  export type Location = {
    latitude: number;
    longitude: number;
  };
  
  export enum EmergencyLevel {
    "Immediate",
    "Urgent",
    "Non-Urgent",
    "Routine",
  }
  
  export type Emergency = {
    capability: Capability[];
    location: Location;
    emergencyId: number;
    emergencyLevel: EmergencyLevel;
    offset: number;
    requirements: number[];
  };
  

export type Resource = {
  id: number,
  capability: Capability,
  origin_lat: number,
  origin_lon: number,
  destination_lat: number | null,
  destination_lon: number | null,
  route: Route | null;
  percent: number | null;
}

export type JsonDataItem = {
  id: number;
  capability: number;
  latitude: number;
  longitude: number;
};


export type Step = {
  name: string,
  duration: number,
  distance: number,
  driving_side: string,
  weight: number,
  mode: string,
  geometry: Geometry
};

export type Leg = {
  weight: number,
  duration: number,
  steps: Step[],
  distance: number,
  summary: string
};

export type Route = {
  start: LatLong;
  end: LatLong;
  geojson: GeoJSON;
  id: string;
  length: number;
  legs: Leg[];
};

export type LatLong = { lat: number; long: number };



export type GeoJSON = {
  type: "Feature";
  properties: {};
  geometry: Geometry;
};


export interface Root {
  routes: RouteInterface[];
  waypoints: Waypoint[];
  code: string;
  uuid: string;
}

export interface RouteInterface {
  weight_name: string;
  weight: number;
  duration: number;
  distance: number;
  legs: Leg[];
  geometry: Geometry2;
}

export interface Admin {
  iso_3166_1_alpha3: string;
  iso_3166_1: string;
}

export interface Intersection {
  entry: boolean[];
  bearings: number[];
  duration?: number;
  mapbox_streets_v8?: MapboxStreetsV8;
  is_urban?: boolean;
  admin_index: number;
  out?: number;
  weight?: number;
  geometry_index: number;
  location: number[];
  in?: number;
  turn_weight?: number;
  turn_duration?: number;
  traffic_signal?: boolean;
  classes?: string[];
  lanes?: Lane[];
}

export interface MapboxStreetsV8 {
  class: string;
}

export interface Lane {
  indications: string[];
  valid_indication?: string;
  valid: boolean;
  active: boolean;
}

export interface Maneuver {
  type: string;
  instruction: string;
  bearing_after: number;
  bearing_before: number;
  location: number[];
  modifier?: string;
}

export interface Geometry {
  coordinates: number[][];
  type: string;
}

export interface Geometry2 {
  coordinates: number[][];
  type: string;
}

export interface Waypoint {
  distance: number;
  name: string;
  location: number[];
}
