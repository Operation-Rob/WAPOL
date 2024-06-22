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
    Immediate,
    Urgent,
    NonUrgent,
    Routine,
  }
  
  export type Emergency = {
    capability: Capability[];
    location: Location;
    emergencyId: number;
    emergencyLevel: EmergencyLevel;
    offset: number;
  };
  