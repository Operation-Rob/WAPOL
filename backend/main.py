from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from optimisation import run_optimisation
import numpy as np
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import os


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
    time_seconds: float


class OptimisationResponse(BaseModel):
    destinations: list[Destination]
    value: float


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"hello": "world", "foo": "bar"}


load_dotenv()
API_KEY = os.getenv("GOOGLE")


def get_distance(origins, destinations):

    # Format the latitude and longitude lists into strings that the API can understand
    origins_str = "|".join([f"{lat},{lon}" for lat, lon in origins])
    destinations_str = "|".join([f"{lat},{lon}" for lat, lon in destinations])

    # Construct the API URL
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {"origins": origins_str, "destinations": destinations_str, "key": API_KEY}

    # Make the GET request
    response = requests.get(url, params=params)
    return response.json()


@app.post("/optimise/")
def optimise(params: OptimisationQuery):

    num_vehicles = len(params.cars)
    num_incidents = len(params.emergencies)

    D = np.zeros((num_vehicles, num_incidents))
    vehicle_types = np.zeros((num_vehicles, 5))
    incident_requirements = np.zeros((num_incidents, 5))
    priorities = []

    distance_data = get_distance(
        [(car.lat, car.lon) for car in params.cars],
        [(emergency.lat, emergency.lon) for emergency in params.emergencies],
    )

    for i, car in enumerate(params.cars):
        for j, emergency in enumerate(params.emergencies):
            D[i][j] = distance_data["rows"][i]["elements"][j]["duration"]["value"]

    for i, car in enumerate(params.cars):
        vehicle_types[i][car.capability] = 1

    for i, emergency in enumerate(params.emergencies):
        priorities.append(emergency.priority)
        incident_requirements[i] = emergency.requirements

    result = run_optimisation(
        D, num_vehicles, num_incidents, priorities, vehicle_types, incident_requirements
    )

    if result is not None:
        destinations = []
        for assignment in result["assignments"]:
            car_index = assignment[0]
            emergency_index = assignment[1]

            car_id = params.cars[car_index].id
            emergency_id = params.emergencies[emergency_index].id
            emergency_lat = params.emergencies[emergency_index].lat
            emergency_lon = params.emergencies[emergency_index].lon

            destinations.append(
                Destination(
                    car_id=car_id,
                    emergency_id=emergency_id,
                    emergency_lat=emergency_lat,
                    emergency_lon=emergency_lon,
                    time_seconds=D[car_index][emergency_index],
                )
            )

        return OptimisationResponse(destinations=destinations, value=result["value"])

    return result
