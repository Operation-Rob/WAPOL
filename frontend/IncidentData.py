import pandas as pd
import json

# Define the incident mapping
incident_mapping = {
    "Incident A": {"Priority": "IMMEDIATE", "Capabilities": [1, 2, 3]},
    "Incident B": {"Priority": "URGENT", "Capabilities": [2, 4, 5]},
    "Incident C": {"Priority": "ROUTINE", "Capabilities": [1, 2]},
    "Incident D": {"Priority": "NON URGENT", "Capabilities": [4]},
    "Incident E": {"Priority": "IMMEDIATE", "Capabilities": [2, 3]}
}

# Function to map capabilities from incident types
def map_capabilities(incident_type):
    return incident_mapping.get(incident_type, {"Priority": "UNKNOWN", "Capabilities": []})

# Load the CSV data into a DataFrame
data = pd.read_csv('/data/PerthIncident.csv')

# Apply mapping to the DataFrame
data['Incident Details'] = data['Incident_Type'].apply(lambda x: map_capabilities(x))
data['Priority'] = data['Incident Details'].apply(lambda x: x['Priority'])
data['Capabilities'] = data['Incident Details'].apply(lambda x: x['Capabilities'])

# Ensure to include Longitude and Latitude in the DataFrame
selected_data = data[['ACC_ID', 'Priority', 'Capabilities', 'LONGITUDE', 'LATITUDE']]

# Convert to JSON
json_data = json.dumps(selected_data.to_dict(orient='records'), indent=4)

