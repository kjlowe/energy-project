from config import *
from models import DatabaseManager
from metadata_loader import load_metadata
from tariff_loader import load_tariff_schedule

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

from proto.tariff import (
    TariffSchedule,
    TariffPeriod,
    OptionalDouble,
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
    return {'fields': result}


def _field_metadata_to_dict(field_metadata: FieldMetadata) -> dict:
    """Serialize FieldMetadata (oneof wrapper) to dict."""
    # Use betterproto's which_one_of to detect the actual field type
    field_type, field_value = betterproto.which_one_of(field_metadata, 'metadata')

    if field_type == 'date_field':
        return {
            'metadata': {
                '$case': 'date_field',
                'date_field': _date_field_to_dict(field_value)
            }
        }
    elif field_type == 'simple_field':
        return {
            'metadata': {
                '$case': 'simple_field',
                'simple_field': _simple_field_to_dict(field_value)
            }
        }
    elif field_type == 'tou_field':
        return {
            'metadata': {
                '$case': 'tou_field',
                'tou_field': _tou_field_to_dict(field_value)
            }
        }
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


# ===== Tariff Serialization Helpers =====

def _optional_double_to_value(opt_double: OptionalDouble | None) -> float | None:
    """Convert OptionalDouble to plain value or None."""
    return opt_double.value if opt_double is not None else None


def _tariff_schedule_to_dict(schedule: TariffSchedule) -> dict:
    """Convert TariffSchedule proto to JSON-serializable dict."""
    return {
        'tariff_name': schedule.tariff_name,
        'description': schedule.description,
        'periods': [_tariff_period_to_dict(p) for p in schedule.periods]
    }


def _tariff_period_to_dict(period: TariffPeriod) -> dict:
    """Serialize TariffPeriod to dict."""
    return {
        'source_file': period.source_file,
        'effective_start': period.effective_start,
        'effective_end': period.effective_end,
        'rates': {
            'delivery_minimum': _optional_double_to_value(period.delivery_minimum),
            'total_meter_charge': _optional_double_to_value(period.total_meter_charge),
            'baseline_credit': _optional_double_to_value(period.baseline_credit),
            'ca_climate_credit': _optional_double_to_value(period.ca_climate_credit),
            'summer': {
                'peak': _optional_double_to_value(period.tou_rates.summer.peak),
                'off_peak': _optional_double_to_value(period.tou_rates.summer.off_peak)
            },
            'winter': {
                'peak': _optional_double_to_value(period.tou_rates.winter.peak),
                'off_peak': _optional_double_to_value(period.tou_rates.winter.off_peak)
            }
        },
        'baseline_quantities': {
            'winter': period.baseline_quantities.winter.territory_t_individually_metered,
            'summer': period.baseline_quantities.summer.territory_t_individually_metered,
            'note': period.baseline_quantities.note
        },
        'tou_periods': {
            'peak_hours': period.tou_periods.peak_hours,
            'peak_days': period.tou_periods.peak_days,
            'off_peak_hours': period.tou_periods.off_peak_hours,
            'summer_season': period.tou_periods.summer_season,
            'winter_season': period.tou_periods.winter_season
        },
        'note': period.note
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
                if field_name not in meter_data['fields']:
                    return jsonify({"error": f"Invalid field: {field_name}"}), 400
                metadata_dict = {meter_type: {'fields': {field_name: meter_data['fields'][field_name]}}}

        return jsonify(metadata_dict)

    except Exception as e:
        app.logger.error(f"Error loading metadata: {e}")
        return jsonify({"error": str(e)}), 500


# Tariff schedule endpoint
@app.route('/api/tariff-schedule', methods=['GET'])
def get_tariff_schedule():
    """
    Get PG&E E-TOU-C tariff rate schedule.

    Query Parameters:
        date (str, optional): Filter by date (YYYY-MM-DD) - returns period effective on that date
        effective_start (str, optional): Filter by exact effective_start date

    Returns:
        JSON: Complete tariff schedule or filtered period(s)

    Examples:
        GET /api/tariff-schedule
        GET /api/tariff-schedule?date=2024-06-15
        GET /api/tariff-schedule?effective_start=2024-04-01
    """
    try:
        schedule = load_tariff_schedule()
        schedule_dict = _tariff_schedule_to_dict(schedule)

        # Optional filtering
        date_filter = request.args.get('date')
        effective_start_filter = request.args.get('effective_start')

        if date_filter:
            # Find period that covers this date
            from datetime import datetime
            try:
                filter_date = datetime.strptime(date_filter, '%Y-%m-%d')
            except ValueError:
                return jsonify({"error": f"Invalid date format: {date_filter}. Expected YYYY-MM-DD"}), 400

            matching_period = None
            for period_dict in schedule_dict['periods']:
                start = period_dict['effective_start']
                end = period_dict['effective_end']

                # Skip "current" periods for date filtering
                if start == 'current' or end == 'current':
                    continue

                start_date = datetime.strptime(start, '%Y-%m-%d')
                end_date = datetime.strptime(end, '%Y-%m-%d')

                if start_date <= filter_date <= end_date:
                    matching_period = period_dict
                    break

            if not matching_period:
                return jsonify({"error": f"No tariff period found for date: {date_filter}"}), 404

            return jsonify({
                'tariff_name': schedule_dict['tariff_name'],
                'description': schedule_dict['description'],
                'period': matching_period
            })

        elif effective_start_filter:
            # Filter by exact effective_start
            matching_periods = [
                p for p in schedule_dict['periods']
                if p['effective_start'] == effective_start_filter
            ]

            if not matching_periods:
                return jsonify({"error": f"No tariff period found with effective_start: {effective_start_filter}"}), 404

            return jsonify({
                'tariff_name': schedule_dict['tariff_name'],
                'description': schedule_dict['description'],
                'periods': matching_periods
            })

        # Return full schedule
        return jsonify(schedule_dict)

    except Exception as e:
        app.logger.error(f"Error loading tariff schedule: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)