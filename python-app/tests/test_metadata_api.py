"""
Unit tests for /api/billing-metadata endpoint.
"""

import pytest
import json
from app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestMetadataAPI:
    """Tests for the billing metadata API endpoint."""

    def test_metadata_endpoint_exists(self, client):
        """Verify endpoint exists and responds."""
        response = client.get('/api/billing-metadata')
        assert response.status_code == 200

    def test_metadata_endpoint_returns_200(self, client):
        """Endpoint responds successfully."""
        response = client.get('/api/billing-metadata')
        assert response.status_code == 200

    def test_metadata_returns_json(self, client):
        """Verify response is JSON."""
        response = client.get('/api/billing-metadata')
        assert response.content_type == 'application/json'

    def test_metadata_full_structure(self, client):
        """Returns complete metadata for both meters."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        # Should have both meter types
        assert 'GENERATION_METER' in data
        assert 'BENEFIT_METER' in data

        # Both should be dicts with fields
        assert isinstance(data['GENERATION_METER'], dict)
        assert isinstance(data['BENEFIT_METER'], dict)
        assert len(data['GENERATION_METER']) > 0
        assert len(data['BENEFIT_METER']) > 0

    def test_metadata_filter_by_generation_meter(self, client):
        """Query param filtering by GENERATION_METER works."""
        response = client.get('/api/billing-metadata?meter_type=GENERATION_METER')
        data = json.loads(response.data)

        # Should only have GENERATION_METER
        assert 'GENERATION_METER' in data
        assert 'BENEFIT_METER' not in data

        # Should have fields
        assert len(data['GENERATION_METER']) > 0

    def test_metadata_filter_by_benefit_meter(self, client):
        """Query param filtering by BENEFIT_METER works."""
        response = client.get('/api/billing-metadata?meter_type=BENEFIT_METER')
        data = json.loads(response.data)

        # Should only have BENEFIT_METER
        assert 'BENEFIT_METER' in data
        assert 'GENERATION_METER' not in data

        # Should have fields
        assert len(data['BENEFIT_METER']) > 0

    def test_metadata_filter_by_field(self, client):
        """Field-specific filtering works."""
        response = client.get(
            '/api/billing-metadata?meter_type=GENERATION_METER&field=pce_energy_cost'
        )
        data = json.loads(response.data)

        # Should only have GENERATION_METER
        assert 'GENERATION_METER' in data
        assert 'BENEFIT_METER' not in data

        # Should only have pce_energy_cost field
        assert 'pce_energy_cost' in data['GENERATION_METER']
        assert len(data['GENERATION_METER']) == 1

    def test_metadata_invalid_meter_type_returns_400(self, client):
        """Error handling for invalid meter type."""
        response = client.get('/api/billing-metadata?meter_type=INVALID_METER')
        assert response.status_code == 400

        data = json.loads(response.data)
        assert 'error' in data
        assert 'valid_values' in data

    def test_metadata_field_not_found_returns_404(self, client):
        """Error handling for field not found."""
        response = client.get(
            '/api/billing-metadata?meter_type=GENERATION_METER&field=nonexistent_field'
        )
        assert response.status_code == 404

        data = json.loads(response.data)
        assert 'error' in data
        assert 'available_fields' in data

    def test_metadata_field_without_meter_type(self, client):
        """Field filter without meter_type returns full metadata."""
        # Field parameter is ignored if meter_type not provided
        response = client.get('/api/billing-metadata?field=pce_energy_cost')
        data = json.loads(response.data)

        # Should return full metadata (field filter ignored)
        assert 'GENERATION_METER' in data
        assert 'BENEFIT_METER' in data

    def test_metadata_has_units(self, client):
        """Verify unit present in leaf nodes."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        # Check simple field has unit
        climate_credit = data['GENERATION_METER']['california_climate_credit']
        assert 'unit' in climate_credit
        assert climate_credit['unit'] == '$'

        # Check TOU field has units in nested structure
        pce_cost = data['GENERATION_METER']['pce_energy_cost']
        assert 'unit' in pce_cost['peak']
        assert 'unit' in pce_cost['off_peak']
        assert 'unit' in pce_cost['total']

    def test_metadata_has_where_found(self, client):
        """Verify where_found arrays exist."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        # Check simple field has where_found
        billing_date = data['GENERATION_METER']['billing_date']
        assert 'where_found' in billing_date
        assert isinstance(billing_date['where_found'], list)
        assert len(billing_date['where_found']) > 0

        # Check TOU field has where_found in nested structure
        pce_cost = data['GENERATION_METER']['pce_energy_cost']
        assert 'where_found' in pce_cost['peak']
        assert 'where_found' in pce_cost['off_peak']
        assert 'where_found' in pce_cost['total']

    def test_metadata_where_found_structure(self, client):
        """Verify where_found has correct structure."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        billing_date = data['GENERATION_METER']['billing_date']
        where_found = billing_date['where_found'][0]

        # Should have expected fields
        assert 'where_from' in where_found
        assert 'where_on_pdf' in where_found
        assert 'kevins_number_code' in where_found

    def test_metadata_date_fields_no_unit(self, client):
        """Date fields should not have unit."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        # Date fields should NOT have unit
        billing_date = data['GENERATION_METER']['billing_date']
        service_end_date = data['GENERATION_METER']['service_end_date']

        assert 'unit' not in billing_date
        assert 'unit' not in service_end_date

    def test_metadata_tou_structure(self, client):
        """TOU fields have peak/off_peak/total structure."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        tou_fields = [
            'energy_export_meter_channel_2',
            'energy_import_meter_channel_1',
            'allocated_export_energy_credits',
            'net_energy_usage_after_credits',
            'pce_energy_cost'
        ]

        for field_name in tou_fields:
            field_data = data['GENERATION_METER'][field_name]

            # Should have peak, off_peak, total
            assert 'peak' in field_data
            assert 'off_peak' in field_data
            assert 'total' in field_data

            # Each should have unit and where_found
            for tou_key in ['peak', 'off_peak', 'total']:
                assert 'unit' in field_data[tou_key]
                assert 'where_found' in field_data[tou_key]

    def test_metadata_energy_fields_have_kwh_unit(self, client):
        """Energy fields should have kWh unit."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        # Check energy import field
        energy_import = data['GENERATION_METER']['energy_import_meter_channel_1']
        assert energy_import['peak']['unit'] == 'kWh'
        assert energy_import['off_peak']['unit'] == 'kWh'
        assert energy_import['total']['unit'] == 'kWh'

    def test_metadata_cost_fields_have_dollar_unit(self, client):
        """Cost fields should have $ unit."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        # Check cost field
        pce_cost = data['GENERATION_METER']['pce_energy_cost']
        assert pce_cost['peak']['unit'] == '$'
        assert pce_cost['off_peak']['unit'] == '$'

        # Check simple cost field
        climate_credit = data['GENERATION_METER']['california_climate_credit']
        assert climate_credit['unit'] == '$'

    def test_metadata_both_meters_have_same_fields(self, client):
        """GENERATION_METER and BENEFIT_METER should have same field names."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        gen_fields = set(data['GENERATION_METER'].keys())
        ben_fields = set(data['BENEFIT_METER'].keys())

        assert gen_fields == ben_fields

    def test_metadata_field_count(self, client):
        """Verify expected number of fields."""
        response = client.get('/api/billing-metadata')
        data = json.loads(response.data)

        # Should have 22 fields for each meter type
        assert len(data['GENERATION_METER']) == 22
        assert len(data['BENEFIT_METER']) == 22
