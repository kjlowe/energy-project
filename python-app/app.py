from flask import Flask, jsonify, request
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React development

@app.route("/")
def home():
    today = datetime.now().strftime("%Y-%m-%d")

    # Use correct path if file is in parent directory
    with open("./billing_data_table.html", "r", encoding="utf-8") as f:
        billing_data_table = f.read()

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Billing Year 2024</title>
</head>
<body>
    <h1>Data</h1>
    {billing_data_table}
    <p>Today's date is: {today}</p>
    <br>
    <h2>API Endpoints:</h2>
    <ul>
        <li><a href="/api/months">Available Months</a></li>
        <li><a href="/api/energy-flow/2024-05">Energy Flow Data (May 2024)</a></li>
    </ul>
</body>
</html>"""

@app.route("/api/energy-flow/<month>")
def get_energy_flow_data(month):
    """Return energy flow data for visualization"""
    # Sample data based on your billing structure
    # This can be connected to your actual billing data later
    
    # Simulate different monthly data
    month_data = {
        "2024-05": {"solar": 2100, "import": 850, "export": 1250, "main_load": 1200, "adu_load": 280},
        "2024-06": {"solar": 2400, "import": 650, "export": 1550, "main_load": 1300, "adu_load": 300},
        "2024-07": {"solar": 2600, "import": 450, "export": 1800, "main_load": 1250, "adu_load": 320},
        "2024-08": {"solar": 2500, "import": 500, "export": 1700, "main_load": 1280, "adu_load": 310},
        "2024-09": {"solar": 2200, "import": 750, "export": 1350, "main_load": 1150, "adu_load": 290},
        "2024-10": {"solar": 1800, "import": 1200, "export": 800, "main_load": 1400, "adu_load": 350},
        "2024-11": {"solar": 1500, "import": 1500, "export": 500, "main_load": 1450, "adu_load": 380},
        "2024-12": {"solar": 1300, "import": 1800, "export": 300, "main_load": 1600, "adu_load": 400}
    }
    
    data = month_data.get(month, month_data["2024-05"])
    
    return jsonify({
        "month": month,
        "nodes": [
            {"id": "grid", "label": "PG&E Grid", "type": "utility", "x": 100, "y": 200},
            {"id": "main_meter", "label": "Main Meter", "type": "meter", "x": 300, "y": 150},
            {"id": "adu_meter", "label": "ADU Meter", "type": "meter", "x": 300, "y": 300},
            {"id": "solar", "label": "Solar Generation", "type": "generation", "x": 100, "y": 50},
            {"id": "main_load", "label": "Main House", "type": "load", "x": 500, "y": 150},
            {"id": "adu_load", "label": "ADU", "type": "load", "x": 500, "y": 300}
        ],
        "edges": [
            {"source": "grid", "target": "main_meter", "value": data["import"], "type": "import", "label": f"{data['import']:,} kWh"},
            {"source": "main_meter", "target": "grid", "value": data["export"], "type": "export", "label": f"{data['export']:,} kWh"},
            {"source": "solar", "target": "main_meter", "value": data["solar"], "type": "generation", "label": f"{data['solar']:,} kWh"},
            {"source": "main_meter", "target": "main_load", "value": data["main_load"], "type": "consumption", "label": f"{data['main_load']:,} kWh"},
            {"source": "adu_meter", "target": "adu_load", "value": data["adu_load"], "type": "consumption", "label": f"{data['adu_load']:,} kWh"},
            {"source": "main_meter", "target": "adu_meter", "value": data["adu_load"], "type": "internal", "label": f"{data['adu_load']:,} kWh"}
        ],
        "billing_summary": {
            "total_export": data["export"],
            "total_import": data["import"],
            "net_usage": data["import"] - data["export"],
            "solar_generation": data["solar"],
            "total_consumption": data["main_load"] + data["adu_load"],
            "estimated_bill": max(0, (data["import"] - data["export"]) * 0.35)  # ~$0.35/kWh
        }
    })

@app.route("/api/months")
def get_available_months():
    """Return available months for dropdown"""
    return jsonify([
        {"value": "2024-05", "label": "May 2024"},
        {"value": "2024-06", "label": "June 2024"},
        {"value": "2024-07", "label": "July 2024"},
        {"value": "2024-08", "label": "August 2024"},
        {"value": "2024-09", "label": "September 2024"},
        {"value": "2024-10", "label": "October 2024"},
        {"value": "2024-11", "label": "November 2024"},
        {"value": "2024-12", "label": "December 2024"}
    ])

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
