import pandas as pd
import json

# File path to the CSV file
csv_file_path = '/data/capabilitiesLOC.csv'  # Replace with your CSV file path

# Read the CSV data into a DataFrame
df = pd.read_csv(csv_file_path)

# Convert the DataFrame to a list of dictionaries
records = df.to_dict(orient='records')

# Convert the list of dictionaries to a JSON string
json_data = json.dumps(records, indent=4)

# Optionally, save the JSON data to a file
with open('vehicles.json', 'w') as json_file:
    json_file.write(json_data)

# Print the JSON data
print(json_data)
