import pandas as pd

# Public Google Sheet details
sheet_id = "1GuHkRddZm5Idxfa-IUlA-lXQFydduyau"
sheet_name = "Billing"  # Change if needed

# Construct CSV export URL
url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"

# Load into a DataFrame
df = pd.read_csv(url)

# Display first few rows
print(df.head())