from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from optimisation import run_optimisation
import numpy as np
from pydantic import BaseModel


class Car(BaseModel):
    lat: float
    lon: float
    capability: int
    id: int

class Emergency(BaseModel):
    lat: float
    lon: float
    priority: str
    requirements: list[int]
    id: int

class OptimisationQuery(BaseModel):
    cars: list[Car]
    emergencies: list[Emergency]

class Destination(BaseModel):
    car_id: int
    emergency_id: int
    emergency_lat: float
    emergency_lon: float

class OptimisationResponse(BaseModel):
    destinations: list[Destination]
    value: float

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"hello": "world", "foo": "bar"}


@app.post("/optimise/")
def optimise(params: OptimisationQuery):

    num_vehicles = len(params.cars)
    num_incidents = len(params.emergencies)

    D = np.zeros((num_vehicles, num_incidents))
    vehicle_types = np.zeros((num_vehicles, 5))
    incident_requirements = np.zeros((num_incidents, 5))
    priorities = []

    for i, car in enumerate(params.cars):
        for j, emergency in enumerate(params.emergencies):
            D[i][j] = np.sqrt((car.lat - emergency.lat)**2 + (car.lon - emergency.lon)**2)
        vehicle_types[i][car.capability] = 1

    for i, emergency in enumerate(params.emergencies):
        priorities.append(emergency.priority)
        incident_requirements[i] = emergency.requirements

    priorities = ['Immediate', 'Urgent', 'Routine']

    result = run_optimisation(D, num_vehicles, num_incidents, priorities, vehicle_types, incident_requirements)

    if result is not None:
        destinations = []
        for assignment in result['assignments']:
            car_index = assignment[0]
            emergency_index = assignment[1]

            car_id = params.cars[car_index].id
            emergency_id = params.emergencies[emergency_index].id
            emergency_lat = params.emergencies[emergency_index].lat
            emergency_lon = params.emergencies[emergency_index].lon

            destinations.append(Destination(car_id=car_id, emergency_id=emergency_id, emergency_lat=emergency_lat, emergency_lon=emergency_lon))

        return OptimisationResponse(destinations=destinations, value=result['value'])  

    return result