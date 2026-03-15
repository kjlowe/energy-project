"""
Tariff loader module for PG&E E-TOU-C tariff rates.

Loads JSON files from documents/ and converts to proto structures.
Validates dates, territories, and rate values.

Pattern follows metadata_loader.py for consistency.
"""

import json
from pathlib import Path
from typing import Optional
from datetime import datetime

from proto.tariff import (
    TariffSchedule,
    TariffPeriod,
    TOURates,
    SeasonalTOURates,
    BaselineQuantities,
    SeasonalBaselineQuantities,
    TOUPeriodDefinitions,
    OptionalDouble,
)

# Territory T is the only supported territory for this application
VALID_TERRITORY = 'T'

# Module-level cache (follows metadata_loader.py pattern)
_tariff_cache: Optional[TariffSchedule] = None


def load_tariff_schedule() -> TariffSchedule:
    """
    Load and cache all tariff periods from JSON files.

    Returns:
        TariffSchedule proto message with all periods

    Raises:
        FileNotFoundError: If documents directory doesn't exist
        ValueError: If JSON structure is invalid or validation fails
    """
    global _tariff_cache

    if _tariff_cache is not None:
        return _tariff_cache

    # Locate tariff files
    documents_path = Path(__file__).parent / 'documents'

    if not documents_path.exists():
        raise FileNotFoundError(f"Documents directory not found: {documents_path}")

    # Find all JSON files matching pattern
    json_files = list(documents_path.glob('Res_Inclu_TOU_*.json'))
    json_files.extend(documents_path.glob('res-inclu-tou-*.json'))

    if not json_files:
        raise FileNotFoundError(f"No tariff JSON files found in {documents_path}")

    # Parse all periods
    periods = []
    for json_file in json_files:
        with open(json_file, 'r') as f:
            json_data = json.load(f)

        period = _parse_tariff_period(json_data, json_file.name)
        periods.append(period)

    # Sort by effective_start (handle "current" as latest)
    periods.sort(key=lambda p: _parse_date_for_sorting(p.effective_start))

    # Create schedule
    _tariff_cache = TariffSchedule(
        tariff_name="E-TOU-C",
        description="Residential Inclusive Time-of-Use",
        periods=periods
    )

    return _tariff_cache


def _parse_tariff_period(data: dict, filename: str) -> TariffPeriod:
    """Parse single tariff period from JSON."""

    # Validate dates
    _validate_date(data['effective_start'], 'effective_start', filename)
    _validate_date(data['effective_end'], 'effective_end', filename)

    # Parse rates
    rates_json = data['rates']
    tou_rates = TOURates(
        summer=SeasonalTOURates(
            peak=_parse_optional_double(rates_json['summer']['peak']),
            off_peak=_parse_optional_double(rates_json['summer']['off_peak'])
        ),
        winter=SeasonalTOURates(
            peak=_parse_optional_double(rates_json['winter']['peak']),
            off_peak=_parse_optional_double(rates_json['winter']['off_peak'])
        )
    )

    # Parse baseline quantities
    baseline_json = data['baseline_quantities']
    baseline_quantities = BaselineQuantities(
        winter=_parse_seasonal_baseline(baseline_json['winter'], filename),
        summer=_parse_seasonal_baseline(baseline_json['summer'], filename),
        note=baseline_json.get('note', '')
    )

    # Parse TOU periods
    tou_periods_json = data['tou_periods']
    tou_periods = TOUPeriodDefinitions(
        peak_hours=tou_periods_json['peak_hours'],
        peak_days=tou_periods_json['peak_days'],
        off_peak_hours=tou_periods_json['off_peak_hours'],
        summer_season=tou_periods_json['summer_season'],
        winter_season=tou_periods_json['winter_season']
    )

    return TariffPeriod(
        source_file=data['source_file'],
        effective_start=data['effective_start'],
        effective_end=data['effective_end'],
        delivery_minimum=_parse_optional_double(rates_json['delivery_minimum']),
        total_meter_charge=_parse_optional_double(rates_json['total_meter_charge']),
        baseline_credit=_parse_optional_double(rates_json['baseline_credit']),
        ca_climate_credit=_parse_optional_double(rates_json['ca_climate_credit']),
        tou_rates=tou_rates,
        baseline_quantities=baseline_quantities,
        tou_periods=tou_periods,
        note=data.get('note', '')
    )


def _parse_seasonal_baseline(seasonal_json: dict, filename: str) -> SeasonalBaselineQuantities:
    """Parse seasonal baseline quantities for Territory T individually metered customers only."""
    # Validate that exactly Territory T is present
    if VALID_TERRITORY not in seasonal_json:
        raise ValueError(
            f"Territory T not found in {filename}. "
            f"This application only supports Territory T baseline quantities."
        )

    if len(seasonal_json) != 1 or list(seasonal_json.keys())[0] != VALID_TERRITORY:
        found_territories = ', '.join(sorted(seasonal_json.keys()))
        raise ValueError(
            f"Invalid territories in {filename}: {found_territories}. "
            f"Only Territory T is supported. Please remove other territories from the JSON file."
        )

    # Territory T value is now directly the individually metered kWh/day
    baseline_value = seasonal_json[VALID_TERRITORY]
    if not isinstance(baseline_value, (int, float)):
        raise ValueError(
            f"Invalid baseline value for Territory T in {filename}. "
            f"Expected a number (kWh/day for individually metered), got {type(baseline_value).__name__}"
        )

    return SeasonalBaselineQuantities(
        territory_t_individually_metered=float(baseline_value)
    )


def _parse_optional_double(value) -> Optional[OptionalDouble]:
    """Convert JSON value to OptionalDouble or None."""
    if value is None:
        return None
    return OptionalDouble(value=float(value))


def _validate_date(date_str: str, field_name: str, filename: str) -> None:
    """Validate date format (YYYY-MM-DD or 'current')."""
    if date_str == 'current':
        return

    try:
        datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        raise ValueError(
            f"Invalid date format for {field_name} in {filename}: {date_str}. "
            f"Expected YYYY-MM-DD or 'current'"
        )


def _parse_date_for_sorting(date_str: str) -> datetime:
    """Parse date for sorting (treat 'current' as far future)."""
    if date_str == 'current':
        return datetime(9999, 12, 31)
    return datetime.strptime(date_str, '%Y-%m-%d')


def clear_cache():
    """Clear the tariff cache (for testing)."""
    global _tariff_cache
    _tariff_cache = None
