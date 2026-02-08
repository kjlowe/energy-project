"""Integration tests for Flask API endpoints."""

import pytest
import json
from app import app as flask_app
from models import DatabaseManager
import os


@pytest.fixture
def app(tmp_path, sample_billing_year):
    """Create Flask app with test database."""
    # Set up test database
    test_db_path = tmp_path / "test_api.db"

    # Temporarily modify the database path
    import config
    original_db_path = config.BILLING_DB
    config.BILLING_DB = test_db_path

    # Initialize database and add test data
    db = DatabaseManager(db_path=str(test_db_path))
    db.add_billing_year(sample_billing_year)

    # Configure Flask app for testing
    flask_app.config['TESTING'] = True

    # Reinitialize the db in app module with test database
    from app import db as app_db
    app_db.db_path = str(test_db_path)
    app_db.engine = db.engine
    app_db.Session = db.Session

    yield flask_app

    # Restore original database path
    config.BILLING_DB = original_db_path


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


def test_get_billing_years_endpoint_exists(client):
    """Test /api/billing-years endpoint exists and returns 200."""
    response = client.get('/api/billing-years')
    assert response.status_code == 200


def test_get_billing_years_structure(client):
    """Test /api/billing-years returns correct JSON structure."""
    response = client.get('/api/billing-years')
    assert response.status_code == 200

    data = response.get_json()
    assert 'billing_years' in data
    assert 'count' in data
    assert isinstance(data['billing_years'], list)
    assert isinstance(data['count'], int)


def test_get_billing_years_returns_data(client):
    """Test /api/billing-years returns billing year data."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    assert data['count'] == 1
    assert len(data['billing_years']) == 1


def test_billing_year_has_complete_data(client):
    """Test that returned billing year has all expected top-level fields."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    assert data['count'] > 0
    by = data['billing_years'][0]

    # Check top-level fields
    assert 'id' in by
    assert 'start_month' in by
    assert 'start_year' in by
    assert 'num_months' in by
    assert 'months' in by
    assert 'billing_months' in by


def test_months_field_exists(client):
    """Test that months field exists (for frontend compatibility)."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    by = data['billing_years'][0]

    assert 'months' in by
    assert isinstance(by['months'], list)
    assert len(by['months']) == 2

    # Check month structure
    month = by['months'][0]
    assert 'month_name' in month
    assert 'year' in month


def test_billing_months_have_nested_data(client):
    """Test that billing_months contain complete nested structure."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    by = data['billing_years'][0]
    assert len(by['billing_months']) == 2

    # Check first billing month
    month = by['billing_months'][0]
    assert 'year' in month
    assert 'month' in month
    assert 'month_label' in month
    assert 'main' in month
    assert 'adu' in month


def test_meter_data_complete(client):
    """Test that meter data has all expected fields."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    main = data['billing_years'][0]['billing_months'][0]['main']

    # Check critical fields exist
    assert 'nem2a_meter_type' in main
    assert 'billing_date' in main
    assert 'service_end_date' in main
    assert 'energy_export_meter_channel_2' in main
    assert 'energy_import_meter_channel_1' in main
    assert 'total_bill_in_mail' in main


def test_tou_metric_structure(client):
    """Test that TOU metrics have peak/off_peak/total structure."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    export = data['billing_years'][0]['billing_months'][0]['main']['energy_export_meter_channel_2']

    assert 'peak' in export
    assert 'off_peak' in export
    assert 'total' in export


def test_metric_has_value_field(client):
    """Test that metrics have calculated value field."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    export = data['billing_years'][0]['billing_months'][0]['main']['energy_export_meter_channel_2']

    # All TOU components should have value field
    assert 'value' in export['peak']
    assert 'value' in export['off_peak']
    assert 'value' in export['total']

    # Check subcomponent_values also exists
    assert 'subcomponent_values' in export['peak']
    assert 'subcomponent_values' in export['off_peak']
    assert 'subcomponent_values' in export['total']


def test_metric_values_correct(client):
    """Test that calculated values are correct."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    export = data['billing_years'][0]['billing_months'][0]['main']['energy_export_meter_channel_2']

    # Verify values match test data
    assert export['peak']['value'] == -113.825
    assert export['off_peak']['value'] == -884.175
    assert export['total']['value'] == -998.0


def test_enum_converted_to_string(client):
    """Test that enums are converted to string names."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    main = data['billing_years'][0]['billing_months'][0]['main']
    adu = data['billing_years'][0]['billing_months'][0]['adu']

    assert main['nem2a_meter_type'] == 'GENERATION_METER'
    assert adu['nem2a_meter_type'] == 'BENEFIT_METER'


def test_adu_meter_data(client):
    """Test that ADU meter data is included."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    adu = data['billing_years'][0]['billing_months'][0]['adu']

    assert adu is not None
    assert 'total_bill_in_mail' in adu
    assert adu['total_bill_in_mail']['value'] == 15.50


def test_all_months_included(client):
    """Test that all billing months are included."""
    response = client.get('/api/billing-years')
    data = response.get_json()

    by = data['billing_years'][0]

    # Should have 2 months
    assert len(by['billing_months']) == 2

    # Check both months have data
    month1 = by['billing_months'][0]
    month2 = by['billing_months'][1]

    assert month1['month'] == 5
    assert month2['month'] == 6
    assert month1['main']['total_bill_in_mail']['value'] == 67.83
    assert month2['main']['total_bill_in_mail']['value'] == 55.25


def test_response_is_valid_json(client):
    """Test that response is valid JSON."""
    response = client.get('/api/billing-years')

    # Should not raise exception
    data = json.loads(response.data)
    assert data is not None


def test_cors_headers(client):
    """Test that CORS headers are set."""
    response = client.get('/api/billing-years')

    # CORS headers should be present
    assert 'Access-Control-Allow-Origin' in response.headers


def test_other_endpoints_still_work(client):
    """Test that other API endpoints still function."""
    # Test /api/data
    response = client.get('/api/data')
    assert response.status_code == 200

    data = response.get_json()
    assert 'nodes' in data
    assert 'edges' in data

    # Test /api/filters
    response = client.get('/api/filters')
    assert response.status_code == 200

    data = response.get_json()
    assert 'categories' in data
    assert 'timeframes' in data
