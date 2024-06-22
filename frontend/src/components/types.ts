export interface Root {
  routes: Route[];
  waypoints: Waypoint[];
  code: string;
  uuid: string;
}

export interface Route {
  weight_name: string;
  weight: number;
  duration: number;
  distance: number;
  legs: Leg[];
  geometry: Geometry2;
}

export interface Leg {
  via_waypoints: any[];
  admins: Admin[];
  weight: number;
  duration: number;
  steps: Step[];
  distance: number;
  summary: string;
}

export interface Admin {
  iso_3166_1_alpha3: string;
  iso_3166_1: string;
}

export interface Step {
  intersections: Intersection[];
  maneuver: Maneuver;
  name: string;
  duration: number;
  distance: number;
  driving_side: string;
  weight: number;
  mode: string;
  geometry: Geometry;
  ref?: string;
  destinations?: string;
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
