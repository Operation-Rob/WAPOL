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


    # num_vehicles = 3
    # num_incidents = 3
    D = [
        [100.0, 20.0, 30.0],
        [26.0, 25.0, 35.0],
        [50.0, 30.0, 40.0],
    ]
    vehicle_types = np.array([
        [1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0]
    ])

    incident_requirements = np.array([
        [1, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0]
    ])

    priorities = ['Immediate', 'Urgent', 'Routine']

    result = run_optimisation(D, num_vehicles, num_incidents, priorities, vehicle_types, incident_requirements)
    return result