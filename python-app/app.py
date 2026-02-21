from config import *
from models import DatabaseManager
from metadata_loader import load_metadata

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import pandas as pd
import betterproto

from proto.metadata import (
    BillingStructureMetadata,
    MeterMetadata,
    FieldMetadata,
    DateFieldMetadata,
    SimpleFieldMetadata,
    TOUFieldMetadata,
    TOUComponentMetadata,
    FieldSource,
    OptionalInt32,
    Unit,
    WhereFrom,
)

app = Flask(__name__)
CORS(app)  # Enable CORS for React app

# Initialize database
db = DatabaseManager()


# ===== Proto Serialization Helpers =====

def _proto_metadata_to_dict(metadata: BillingStructureMetadata) -> dict:
    """Convert BillingStructureMetadata proto to JSON-serializable dict."""
    return {
        'generation_meter': _meter_metadata_to_dict(metadata.generation_meter),
        'benefit_meter': _meter_metadata_to_dict(metadata.benefit_meter)
    }


def _meter_metadata_to_dict(meter: MeterMetadata) -> dict:
    """Serialize MeterMetadata map to dict."""
    result = {}
    for field_name, field_metadata in meter.fields.items():
        result[field_name] = _field_metadata_to_dict(field_metadata)
    return result


def _field_metadata_to_dict(field_metadata: FieldMetadata) -> dict:
    """Serialize FieldMetadata (oneof wrapper) to dict."""
    # Use betterproto's which_one_of to detect the actual field type
    field_type, field_value = betterproto.which_one_of(field_metadata, 'metadata')

    if field_type == 'date_field':
        return _date_field_to_dict(field_value)
    elif field_type == 'simple_field':
        return _simple_field_to_dict(field_value)
    elif field_type == 'tou_field':
        return _tou_field_to_dict(field_value)
    else:
        raise ValueError(f"Unknown field type: {field_type}")


def _date_field_to_dict(field: DateFieldMetadata) -> dict:
    """Serialize DateFieldMetadata."""
    return {
        'where_found': [_source_to_dict(s) for s in field.where_found]
    }


def _simple_field_to_dict(field: SimpleFieldMetadata) -> dict:
    """Serialize SimpleFieldMetadata."""
    return {
        'unit': Unit(field.unit).name,
        'where_found': [_source_to_dict(s) for s in field.where_found]
    }


def _tou_field_to_dict(field: TOUFieldMetadata) -> dict:
    """Serialize TOUFieldMetadata."""
    return {
        'peak': _tou_component_to_dict(field.peak),
        'off_peak': _tou_component_to_dict(field.off_peak),
        'total': _tou_component_to_dict(field.total)
    }


def _tou_component_to_dict(comp: TOUComponentMetadata) -> dict:
    """Serialize TOUComponentMetadata."""
    return {
        'unit': Unit(comp.unit).name,
        'where_found': [_source_to_dict(s) for s in comp.where_found]
    }


def _source_to_dict(source: FieldSource) -> dict:
    """Serialize FieldSource."""
    # Unwrap OptionalInt32 wrapper for kevins_number_code
    kevins_code = None
    if source.kevins_number_code is not None:
        kevins_code = source.kevins_number_code.value

    return {
        'where_from': WhereFrom(source.where_from).name,
        'where_on_pdf': source.where_on_pdf if source.where_on_pdf else None,
        'kevins_number_code': kevins_code
    }


# ===== API Endpoints =====

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

    Returns proto-based metadata serialized to JSON.

    Query Parameters:
        meter_type (str, optional): Filter by generation_meter or benefit_meter
        field (str, optional): Get metadata for specific field (requires meter_type)

    Returns:
        JSON: Complete metadata or filtered subset

    Examples:
        GET /api/billing-metadata
        GET /api/billing-metadata?meter_type=generation_meter
        GET /api/billing-metadata?meter_type=generation_meter&field=pce_energy_cost
    """
    try:
        # Load proto metadata
        metadata_proto: BillingStructureMetadata = load_metadata()

        # Convert proto to JSON-serializable dict
        metadata_dict = _proto_metadata_to_dict(metadata_proto)

        # Optional filtering
        meter_type = request.args.get('meter_type')
        field_name = request.args.get('field')

        if meter_type:
            if meter_type not in metadata_dict:
                return jsonify({"error": f"Invalid meter_type: {meter_type}"}), 400

            metadata_dict = {meter_type: metadata_dict[meter_type]}

            if field_name:
                meter_data = metadata_dict[meter_type]
                if field_name not in meter_data:
                    return jsonify({"error": f"Invalid field: {field_name}"}), 400
                metadata_dict = {meter_type: {field_name: meter_data[field_name]}}

        return jsonify(metadata_dict)

    except Exception as e:
        app.logger.error(f"Error loading metadata: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)