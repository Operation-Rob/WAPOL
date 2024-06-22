import numpy as np
from ortools.linear_solver import pywraplp

def build_and_solve(priority, vehicle_types, incident_requirements, distances, num_vehicles, num_incidents, priorities, already_allocated, slack_penalty=0):
    # Create a new solver instance
    solver = pywraplp.Solver.CreateSolver('CBC')

    # Variables
    x = {}
    for i in range(num_vehicles):
        for j in range(num_incidents):
            x[(i, j)] = solver.BoolVar(f'x[{i},{j}]')

    # Objective: Minimize distance
    objective = solver.Objective()
    for i in range(num_vehicles):
        for j in range(num_incidents):
            # All pairs shortest paths
            objective.SetCoefficient(x[(i, j)], distances[i][j])

    objective.SetMinimization()

    # Constraints
    # Each vehicle can only be assigned to one incident
    for i in range(num_vehicles):
        solver.Add(solver.Sum(x[(i, j)] for j in range(num_incidents)) <= 1)


    # Category-based vehicle assignment per incident
    num_categories = vehicle_types.shape[1]
    slack = {}  # Dictionary to hold the slack variables

    for j in range(num_incidents):
        for k in range(num_categories):
            slack[(j, k)] = solver.IntVar(0, solver.infinity(), f'slack_{j}_{k}')
            if priorities[j] == priority:
                # Modified constraint with slack variable
                solver.Add(solver.Sum(x[(i, j)] for i in range(num_vehicles) if vehicle_types[i][k] == 1) + slack[(j, k)] == incident_requirements[j][k])
            else:
                # Ensure no vehicles are assigned to non-priority incidents
                solver.Add(solver.Sum(x[(i, j)] for i in range(num_vehicles)) == 0)

    # Include slack penalties in the objective
    for j in range(num_incidents):
        for k in range(num_categories):
            objective.SetCoefficient(slack[(j, k)], slack_penalty)


    # Ensure that already allocated vehicles are not allocated again
    solver.Add(solver.Sum(x[(i, j)] for i in already_allocated for j in range(num_incidents)) == 0)

    # Solve the model
    optimal_asgn = []
    if solver.Solve() == pywraplp.Solver.OPTIMAL:
        for i in range(num_vehicles):
            for j in range(num_incidents):
                if x[(i, j)].solution_value() > 0.5 and priorities[j] == priority:
                    optimal_asgn.append((i, j))

        return {
            'priority': priority,
            'assignments': optimal_asgn,
            'value': solver.Objective().Value()
        }
    else:
        return None


ALL_PRIORITIES = ['Immediate', 'Urgent', 'Routine', 'Non-Urgent']


def run_optimisation(distances, num_vehicles, num_incidents, priorities, vehicle_types, incident_requirements):
    allocated_locations = []
    
    overall_result = {
        'assignments': [],
        'value': 0
    }

    for priority in ALL_PRIORITIES:
        results = build_and_solve(priority, vehicle_types, incident_requirements, distances, num_vehicles, num_incidents, priorities, allocated_locations, slack_penalty=10000)
        print(results)
        if results is not None:
            allocated_locations.extend(assignment[0] for assignment in results['assignments'])
            overall_result['assignments'].extend(results['assignments'])
            overall_result['value'] += results['value']
        else:
            print(f"No solution found for priority {priority}")
    return overall_result
