from config import *
from models import DatabaseManager

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for React app

# Initialize database
db = DatabaseManager()

# Billing year endpoints
@app.route('/api/billing-years', methods=['GET'])
def get_billing_years():
    """Get all billing years from database."""
    billing_years = db.get_all_billing_years()
    return jsonify({"billing_years": billing_years, "count": len(billing_years)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)