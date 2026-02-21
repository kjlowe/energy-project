from config import *
from models import DatabaseManager
from metadata_loader import load_metadata

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

# Metadata endpoint
@app.route('/api/billing-metadata', methods=['GET'])
def get_billing_metadata():
    """
    Get billing structure metadata including units and sources.

    Query Parameters:
        meter_type (str, optional): Filter by GENERATION_METER or BENEFIT_METER
        field (str, optional): Get metadata for specific field (requires meter_type)

    Returns:
        JSON: Complete metadata or filtered subset

    Examples:
        GET /api/billing-metadata
        GET /api/billing-metadata?meter_type=GENERATION_METER
        GET /api/billing-metadata?meter_type=GENERATION_METER&field=pce_energy_cost
    """
    try:
        metadata = load_metadata()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to load metadata: {str(e)}"}), 500

    # Optional filtering by meter_type
    meter_type = request.args.get('meter_type')
    field = request.args.get('field')

    if meter_type:
        if meter_type not in metadata:
            return jsonify({
                "error": f"Invalid meter_type: {meter_type}",
                "valid_values": list(metadata.keys())
            }), 400

        metadata = {meter_type: metadata[meter_type]}

        # Optional filtering by field (only if meter_type is provided)
        if field:
            if field not in metadata[meter_type]:
                return jsonify({
                    "error": f"Field '{field}' not found in {meter_type}",
                    "available_fields": list(metadata[meter_type].keys())
                }), 404

            metadata = {meter_type: {field: metadata[meter_type][field]}}

    return jsonify(metadata)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)