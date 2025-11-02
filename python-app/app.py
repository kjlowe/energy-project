from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for React app

@app.route('/api/data')
def get_data():
    # Sample flowchart data - replace with your actual data
    nodes = [
        {"id": "1", "label": "Start", "x": 100, "y": 100, "type": "start"},
        {"id": "2", "label": "Process", "x": 300, "y": 100, "type": "process"},
        {"id": "3", "label": "End", "x": 500, "y": 100, "type": "end"}
    ]
    
    edges = [
        {"source": "1", "target": "2", "value": 25},
        {"source": "2", "target": "3", "value": 15}
    ]
    
    return jsonify({"nodes": nodes, "edges": edges})

@app.route('/api/filters')
def get_filters():
    return jsonify({
        "categories": ["All", "Energy", "Billing", "Usage"],
        "timeframes": ["Daily", "Weekly", "Monthly"]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)