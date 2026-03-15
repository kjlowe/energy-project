"""
Unit tests for /api/tariff-schedule endpoint.
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


class TestTariffScheduleAPI:
    """Tests for the tariff schedule API endpoint."""

    def test_tariff_endpoint_exists(self, client):
        """Verify endpoint exists and responds."""
        response = client.get('/api/tariff-schedule')
        assert response.status_code == 200

    def test_tariff_endpoint_returns_200(self, client):
        """Endpoint responds successfully."""
        response = client.get('/api/tariff-schedule')
        assert response.status_code == 200

    def test_tariff_returns_json(self, client):
        """Verify response is JSON."""
        response = client.get('/api/tariff-schedule')
        assert response.content_type == 'application/json'

    def test_tariff_full_structure(self, client):
        """Returns complete tariff schedule structure."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        # Should have top-level fields
        assert 'tariff_name' in data
        assert 'description' in data
        assert 'periods' in data

        # tariff_name should be E-TOU-C
        assert data['tariff_name'] == 'E-TOU-C'

        # periods should be a list
        assert isinstance(data['periods'], list)
        assert len(data['periods']) > 0

    def test_tariff_period_structure(self, client):
        """Verify each period has expected structure."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        period = data['periods'][0]

        # Required fields
        assert 'source_file' in period
        assert 'effective_start' in period
        assert 'effective_end' in period
        assert 'delivery_minimum' in period
        assert 'total_meter_charge' in period
        assert 'baseline_credit' in period
        assert 'ca_climate_credit' in period
        assert 'tou_rates' in period
        assert 'baseline_quantities' in period
        assert 'tou_periods' in period
        assert 'note' in period

    def test_tariff_optional_double_structure(self, client):
        """Verify OptionalDouble fields have correct structure."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        # Find a period with non-null delivery_minimum
        period = None
        for p in data['periods']:
            if p['delivery_minimum'] is not None:
                period = p
                break

        assert period is not None, "Should have at least one period with delivery_minimum"

        # Should be a dict with 'value' key
        assert isinstance(period['delivery_minimum'], dict)
        assert 'value' in period['delivery_minimum']
        assert isinstance(period['delivery_minimum']['value'], (int, float))

    def test_tariff_tou_rates_structure(self, client):
        """Verify TOU rates have correct structure."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        period = data['periods'][0]
        tou_rates = period['tou_rates']

        # Should have summer and winter
        assert 'summer' in tou_rates
        assert 'winter' in tou_rates

        # Each season should have peak and off_peak
        assert 'peak' in tou_rates['summer']
        assert 'off_peak' in tou_rates['summer']
        assert 'peak' in tou_rates['winter']
        assert 'off_peak' in tou_rates['winter']

    def test_tariff_baseline_quantities_structure(self, client):
        """Verify baseline quantities have correct structure."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        period = data['periods'][0]
        baseline = period['baseline_quantities']

        # Should have winter, summer, and note
        assert 'winter' in baseline
        assert 'summer' in baseline
        assert 'note' in baseline

        # Should have territory_t_individually_metered
        assert 'territory_t_individually_metered' in baseline['winter']
        assert 'territory_t_individually_metered' in baseline['summer']

        # Values should be numbers
        assert isinstance(baseline['winter']['territory_t_individually_metered'], (int, float))
        assert isinstance(baseline['summer']['territory_t_individually_metered'], (int, float))

    def test_tariff_tou_periods_structure(self, client):
        """Verify TOU period definitions have correct structure."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        period = data['periods'][0]
        tou_periods = period['tou_periods']

        # Should have all expected fields
        assert 'peak_hours' in tou_periods
        assert 'peak_days' in tou_periods
        assert 'off_peak_hours' in tou_periods
        assert 'summer_season' in tou_periods
        assert 'winter_season' in tou_periods

        # All should be strings
        assert isinstance(tou_periods['peak_hours'], str)
        assert isinstance(tou_periods['peak_days'], str)
        assert isinstance(tou_periods['off_peak_hours'], str)
        assert isinstance(tou_periods['summer_season'], str)
        assert isinstance(tou_periods['winter_season'], str)

    def test_tariff_filter_by_date(self, client):
        """Date filtering returns single period."""
        response = client.get('/api/tariff-schedule?date=2024-06-15')
        data = json.loads(response.data)

        # Should have top-level fields
        assert 'tariff_name' in data
        assert 'description' in data
        assert 'period' in data

        # Should have period (singular), not periods
        assert 'period' in data
        assert 'periods' not in data

        # Period should match date range
        period = data['period']
        assert period['effective_start'] <= '2024-06-15'
        assert period['effective_end'] >= '2024-06-15'

    def test_tariff_filter_by_effective_start(self, client):
        """Filter by exact effective_start date."""
        response = client.get('/api/tariff-schedule?effective_start=2024-04-01')
        data = json.loads(response.data)

        # Should have periods (plural)
        assert 'periods' in data
        assert isinstance(data['periods'], list)

        # All periods should match effective_start
        for period in data['periods']:
            assert period['effective_start'] == '2024-04-01'

    def test_tariff_date_not_found_returns_404(self, client):
        """Date with no matching period returns 404."""
        response = client.get('/api/tariff-schedule?date=2020-01-01')
        assert response.status_code == 404

        data = json.loads(response.data)
        assert 'error' in data

    def test_tariff_invalid_date_format_returns_400(self, client):
        """Invalid date format returns 400."""
        response = client.get('/api/tariff-schedule?date=invalid-date')
        assert response.status_code == 400

        data = json.loads(response.data)
        assert 'error' in data

    def test_tariff_effective_start_not_found_returns_404(self, client):
        """effective_start with no match returns 404."""
        response = client.get('/api/tariff-schedule?effective_start=2020-01-01')
        assert response.status_code == 404

        data = json.loads(response.data)
        assert 'error' in data

    def test_tariff_multiple_periods_exist(self, client):
        """Verify multiple tariff periods are returned."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        # Should have multiple periods (historical data)
        assert len(data['periods']) >= 5

    def test_tariff_current_period_exists(self, client):
        """Verify 'current' period is included."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        # Find 'current' period
        current_period = None
        for period in data['periods']:
            if period['effective_start'] == 'current' and period['effective_end'] == 'current':
                current_period = period
                break

        assert current_period is not None, "Should have a 'current' period"

    def test_tariff_rates_are_numeric_or_null(self, client):
        """Verify rate values are numeric or None."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        for period in data['periods']:
            # Optional fields can be None
            if period['delivery_minimum'] is not None:
                assert 'value' in period['delivery_minimum']
                assert isinstance(period['delivery_minimum']['value'], (int, float))

            if period['total_meter_charge'] is not None:
                assert 'value' in period['total_meter_charge']
                assert isinstance(period['total_meter_charge']['value'], (int, float))

            # TOU rates
            tou_rates = period['tou_rates']
            if tou_rates['summer']['peak'] is not None:
                assert 'value' in tou_rates['summer']['peak']
                assert isinstance(tou_rates['summer']['peak']['value'], (int, float))

    def test_tariff_baseline_quantities_are_positive(self, client):
        """Verify baseline quantities are positive numbers."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        for period in data['periods']:
            baseline = period['baseline_quantities']
            winter_baseline = baseline['winter']['territory_t_individually_metered']
            summer_baseline = baseline['summer']['territory_t_individually_metered']

            # Should be positive
            assert winter_baseline > 0
            assert summer_baseline > 0

    def test_tariff_periods_chronologically_ordered(self, client):
        """Verify periods are in chronological order."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        # Filter out 'current' periods for chronological check
        dated_periods = [
            p for p in data['periods']
            if p['effective_start'] != 'current'
        ]

        # Should be sorted by effective_start
        for i in range(len(dated_periods) - 1):
            current_start = dated_periods[i]['effective_start']
            next_start = dated_periods[i + 1]['effective_start']
            assert current_start <= next_start

    def test_tariff_note_field_is_string(self, client):
        """Verify note field is a string."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        for period in data['periods']:
            assert isinstance(period['note'], str)

    def test_tariff_source_file_present(self, client):
        """Verify source_file field is present and non-empty."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        for period in data['periods']:
            assert 'source_file' in period
            assert isinstance(period['source_file'], str)
            assert len(period['source_file']) > 0

    def test_tariff_cors_headers(self, client):
        """Test that CORS headers are set."""
        response = client.get('/api/tariff-schedule')
        assert 'Access-Control-Allow-Origin' in response.headers

    def test_tariff_response_is_valid_json(self, client):
        """Test that response is valid JSON."""
        response = client.get('/api/tariff-schedule')
        # Should not raise exception
        data = json.loads(response.data)
        assert data is not None

    def test_tariff_climate_credit_can_be_null(self, client):
        """Verify ca_climate_credit can be null (not always applied)."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        # Find at least one period with null climate credit
        has_null_credit = any(
            period['ca_climate_credit'] is None
            for period in data['periods']
        )

        # Should have at least one period with null climate credit
        assert has_null_credit, "Should have periods with null ca_climate_credit"

    def test_tariff_rates_have_expected_precision(self, client):
        """Verify rate values have reasonable precision."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        # Find a period with rates
        period = None
        for p in data['periods']:
            if p['tou_rates']['summer']['peak'] is not None:
                period = p
                break

        assert period is not None

        # Check peak rate is a reasonable value (between $0.01 and $10.00)
        peak_rate = period['tou_rates']['summer']['peak']['value']
        assert 0.01 <= peak_rate <= 10.0

    def test_tariff_territory_t_only(self, client):
        """Verify only Territory T baseline quantities are returned."""
        response = client.get('/api/tariff-schedule')
        data = json.loads(response.data)

        for period in data['periods']:
            baseline = period['baseline_quantities']

            # Should only have territory_t_individually_metered
            assert 'territory_t_individually_metered' in baseline['winter']
            assert 'territory_t_individually_metered' in baseline['summer']

            # Should not have other territories
            winter_keys = baseline['winter'].keys()
            summer_keys = baseline['summer'].keys()

            assert len(winter_keys) == 1
            assert len(summer_keys) == 1
