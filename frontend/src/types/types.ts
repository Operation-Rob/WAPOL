enum Capability {
    A = 1,
    B = 2,
    C = 3,
    D = 4,
    E = 5,
  }
  
  type Location = {
    latitude: number;
    longitude: number;
  };
  
  enum EmergencyLevel {
    Immediate,
    Urgent,
    NonUrgent,
    Routine,
  }
  
  type Emergency = {
    capability: Capability;
    location: Location;
    emergencyId: number;
    emergencyLevel: EmergencyLevel;
  };
  