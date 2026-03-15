"""Tests for tariff_loader module."""

import pytest
from datetime import datetime
from pathlib import Path

from tariff_loader import (
    load_tariff_schedule,
    clear_cache,
    _parse_optional_double,
    _validate_date,
    _parse_date_for_sorting,
    VALID_TERRITORY,
)

from proto.tariff import OptionalDouble


class TestOptionalDouble:
    """Test OptionalDouble handling."""

    def test_parse_optional_double_with_value(self):
        """Test parsing a non-null value."""
        result = _parse_optional_double(42.5)
        assert result is not None
        assert isinstance(result, OptionalDouble)
        assert result.value == 42.5

    def test_parse_optional_double_with_zero(self):
        """Test parsing zero (should create OptionalDouble, not None)."""
        result = _parse_optional_double(0.0)
        assert result is not None
        assert isinstance(result, OptionalDouble)
        assert result.value == 0.0

    def test_parse_optional_double_with_none(self):
        """Test parsing None (should return None)."""
        result = _parse_optional_double(None)
        assert result is None

    def test_parse_optional_double_with_negative(self):
        """Test parsing negative value (for baseline_credit, ca_climate_credit)."""
        result = _parse_optional_double(-55.17)
        assert result is not None
        assert isinstance(result, OptionalDouble)
        assert result.value == -55.17


class TestDateValidation:
    """Test date validation."""

    def test_validate_valid_date(self):
        """Test validating a valid YYYY-MM-DD date."""
        # Should not raise
        _validate_date('2024-06-15', 'test_field', 'test.json')

    def test_validate_current_keyword(self):
        """Test validating 'current' keyword."""
        # Should not raise
        _validate_date('current', 'test_field', 'test.json')

    def test_validate_invalid_date_format(self):
        """Test validating an invalid date format."""
        with pytest.raises(ValueError, match="Invalid date format"):
            _validate_date('06/15/2024', 'test_field', 'test.json')

    def test_validate_invalid_date_value(self):
        """Test validating an invalid date value."""
        with pytest.raises(ValueError, match="Invalid date format"):
            _validate_date('2024-13-01', 'test_field', 'test.json')

    def test_validate_empty_string(self):
        """Test validating an empty string."""
        with pytest.raises(ValueError, match="Invalid date format"):
            _validate_date('', 'test_field', 'test.json')


class TestDateSorting:
    """Test date sorting functionality."""

    def test_parse_date_for_sorting_valid_date(self):
        """Test parsing a valid date for sorting."""
        result = _parse_date_for_sorting('2024-06-15')
        assert isinstance(result, datetime)
        assert result.year == 2024
        assert result.month == 6
        assert result.day == 15

    def test_parse_date_for_sorting_current(self):
        """Test that 'current' is treated as far future."""
        result = _parse_date_for_sorting('current')
        assert isinstance(result, datetime)
        assert result.year == 9999
        assert result.month == 12
        assert result.day == 31

    def test_date_sorting_order(self):
        """Test that dates sort correctly with 'current' at the end."""
        dates = ['current', '2024-06-15', '2024-04-01', '2025-01-01']
        sorted_dates = sorted(dates, key=_parse_date_for_sorting)
        assert sorted_dates == ['2024-04-01', '2024-06-15', '2025-01-01', 'current']


class TestTerritoryValidation:
    """Test territory code validation."""

    def test_valid_territory(self):
        """Test that only Territory T is supported."""
        assert VALID_TERRITORY == 'T'


class TestTariffScheduleLoading:
    """Test loading the complete tariff schedule."""

    @pytest.fixture(autouse=True)
    def clear_cache_before_test(self):
        """Clear cache before each test."""
        clear_cache()
        yield
        clear_cache()

    def test_load_tariff_schedule_success(self):
        """Test successfully loading the tariff schedule."""
        schedule = load_tariff_schedule()

        # Verify schedule structure
        assert schedule.tariff_name == "E-TOU-C"
        assert schedule.description == "Residential Inclusive Time-of-Use"
        assert len(schedule.periods) > 0

    def test_load_tariff_schedule_caching(self):
        """Test that tariff schedule is cached."""
        schedule1 = load_tariff_schedule()
        schedule2 = load_tariff_schedule()

        # Should return the same cached object
        assert schedule1 is schedule2

    def test_tariff_periods_sorted_by_date(self):
        """Test that tariff periods are sorted by effective_start."""
        schedule = load_tariff_schedule()

        # Check that dates are in ascending order (except 'current' at the end)
        dates = [p.effective_start for p in schedule.periods]

        # Convert to datetime for comparison (excluding 'current')
        date_objs = []
        current_at_end = False
        for date_str in dates:
            if date_str == 'current':
                current_at_end = True
            else:
                if current_at_end:
                    pytest.fail("'current' should be at the end of the sorted list")
                date_objs.append(datetime.strptime(date_str, '%Y-%m-%d'))

        # Verify dates are sorted
        assert date_objs == sorted(date_objs)

    def test_tariff_period_structure(self):
        """Test that tariff periods have the expected structure."""
        schedule = load_tariff_schedule()

        for period in schedule.periods:
            # Required fields
            assert period.source_file
            assert period.effective_start
            assert period.effective_end

            # TOU rates
            assert period.tou_rates is not None
            assert period.tou_rates.summer is not None
            assert period.tou_rates.winter is not None

            # Baseline quantities
            assert period.baseline_quantities is not None
            assert period.baseline_quantities.winter is not None
            assert period.baseline_quantities.summer is not None

            # TOU periods
            assert period.tou_periods is not None
            assert period.tou_periods.peak_hours
            assert period.tou_periods.peak_days
            assert period.tou_periods.off_peak_hours

    def test_baseline_quantities_have_territory_t(self):
        """Test that baseline quantities contain Territory T individually metered values."""
        schedule = load_tariff_schedule()

        for period in schedule.periods:
            # Check winter has territory_t_individually_metered
            assert period.baseline_quantities.winter.territory_t_individually_metered > 0

            # Check summer has territory_t_individually_metered
            assert period.baseline_quantities.summer.territory_t_individually_metered > 0

    def test_rates_can_be_nullable(self):
        """Test that rates can be null (for 'current' file)."""
        schedule = load_tariff_schedule()

        # Find the 'current' period
        current_period = None
        for period in schedule.periods:
            if period.effective_start == 'current':
                current_period = period
                break

        # Current period may or may not have null rates depending on JSON
        # Just verify the structure handles OptionalDouble correctly
        if current_period:
            # These should be either OptionalDouble or None, not raise errors
            assert current_period.delivery_minimum is None or isinstance(
                current_period.delivery_minimum, OptionalDouble
            )

class TestCacheClear:
    """Test cache clearing functionality."""

    def test_clear_cache_allows_reload(self):
        """Test that clear_cache allows reloading the schedule."""
        schedule1 = load_tariff_schedule()
        clear_cache()
        schedule2 = load_tariff_schedule()

        # After clearing cache, should load a new instance
        # Note: The content should be the same, but the object is different
        assert schedule1 is not schedule2
        assert len(schedule1.periods) == len(schedule2.periods)
