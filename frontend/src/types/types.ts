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
  capability: number,
  longitude: number,
  latitude: number,
}



