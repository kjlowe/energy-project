"""Utilities for protobuf serialization to frontend-compatible JSON."""

from proto.billing import (
    BillingYear,
    NEM2AAggregationBillingMonth,
    MeterBillingMonth,
    EnergyMetric,
    EnergyMetricTOU,
    NEM2AMeterType,
    EnergyDate,
    MonthLabel
)
from billing_calculations import (
    calculate_meter_values,
    calculate_allocation_import_percentage,
    calculate_allocation_cumulative_percentage
)


def proto_to_dict(billing_year: BillingYear) -> dict:
    """
    Convert BillingYear protobuf to frontend-compatible dictionary.

    Transformations:
    - billing_months → months (for frontend compatibility)
    - Adds 'value' field to each metric (sum of subcomponent_values)
    - Converts enums to string names
    - Recursively serializes all nested messages
    - Calculates yearly cumulative allocation percentages

    Args:
        billing_year: BillingYear protobuf message

    Returns:
        Dictionary with complete nested structure ready for JSON serialization
    """
    if not billing_year:
        return {}

    # Serialize all billing months
    billing_months = [_serialize_billing_month(bm) for bm in billing_year.billing_months]

    # Calculate cumulative allocation percentages for the year
    _add_cumulative_allocation_percentages(billing_months)

    result = {
        'start_month': billing_year.start_month,
        'start_year': billing_year.start_year,
        'num_months': billing_year.num_months,
        'months': [_serialize_month_label(m) for m in billing_year.months],
        'billing_months': billing_months
    }

    return result


def _serialize_month_label(month_label: MonthLabel) -> dict:
    """Serialize MonthLabel to dict."""
    return {
        'month_name': month_label.month_name,
        'year': month_label.year
    }


def _serialize_billing_month(billing_month: NEM2AAggregationBillingMonth) -> dict:
    """
    Serialize NEM2AAggregationBillingMonth to dict with runtime calculations.

    Calculations are applied after basic serialization:
    1. Generation meter (main) calculated first
    2. Benefit meter (adu) calculated second (uses generation meter results)
    """
    # First serialize without calculations
    main_serialized = _serialize_meter(billing_month.main) if billing_month.main else None
    adu_serialized = _serialize_meter(billing_month.adu) if billing_month.adu else None

    # Apply calculations to generation meter (main)
    if main_serialized:
        calculated_values = calculate_meter_values(main_serialized, generation_meter_data=None)
        main_serialized = _merge_calculated_values(main_serialized, calculated_values)

    # Apply calculations to benefit meter (adu) - needs generation meter data
    if adu_serialized and main_serialized:
        calculated_values = calculate_meter_values(adu_serialized, generation_meter_data=main_serialized)
        adu_serialized = _merge_calculated_values(adu_serialized, calculated_values)

    # Calculate monthly allocation_import_percentage for both meters
    if main_serialized and adu_serialized:
        main_import_total = _get_nested_value(main_serialized, 'energy_import_meter_channel_1', 'total', 'value')
        adu_import_total = _get_nested_value(adu_serialized, 'energy_import_meter_channel_1', 'total', 'value')

        # Calculate for main meter
        main_import_pct = calculate_allocation_import_percentage(
            main_import_total, main_import_total, adu_import_total
        )
        if main_import_pct is not None:
            main_serialized['allocation_import_percentage'] = {'value': main_import_pct}

        # Calculate for adu meter
        adu_import_pct = calculate_allocation_import_percentage(
            adu_import_total, main_import_total, adu_import_total
        )
        if adu_import_pct is not None:
            adu_serialized['allocation_import_percentage'] = {'value': adu_import_pct}

    return {
        'year': billing_month.year,
        'month': billing_month.month,
        'month_label': _serialize_month_label(billing_month.month_label) if billing_month.month_label else None,
        'main': main_serialized,
        'adu': adu_serialized
    }


def _merge_calculated_values(original: dict, calculated: dict) -> dict:
    """
    Merge calculated values into original serialized meter data.

    Calculated values override original values where they exist.
    Preserves subcomponent_values from original.

    Args:
        original: Serialized meter dict from _serialize_meter()
        calculated: Calculated values dict from calculate_meter_values()

    Returns:
        Merged dictionary
    """
    if not calculated:
        return original

    result = original.copy()

    for field_name, field_data in calculated.items():
        if field_name not in result:
            result[field_name] = field_data
        elif isinstance(field_data, dict) and isinstance(result[field_name], dict):
            # Deep merge for nested structures (TOU metrics)
            result[field_name] = _deep_merge(result[field_name], field_data)
        else:
            result[field_name] = field_data

    return result


def _deep_merge(base: dict, override: dict) -> dict:
    """
    Deep merge two dictionaries, with override taking precedence.

    Args:
        base: Base dictionary
        override: Override dictionary (values take precedence)

    Returns:
        Merged dictionary
    """
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def _serialize_meter(meter: MeterBillingMonth) -> dict:
    """
    Serialize MeterBillingMonth to dict with all 23 fields.

    Converts NEM2AMeterType enum to string and serializes all energy metrics.
    """
    if not meter:
        return None

    return {
        # Enum converted to string
        'nem2a_meter_type': NEM2AMeterType(meter.nem2a_meter_type).name if meter.nem2a_meter_type else 'NEM2A_METER_TYPE_UNSPECIFIED',

        # Dates
        'billing_date': _serialize_date(meter.billing_date),
        'service_end_date': _serialize_date(meter.service_end_date),

        # TOU Metrics (4 fields)
        'energy_export_meter_channel_2': _serialize_tou_metric(meter.energy_export_meter_channel_2),
        'energy_import_meter_channel_1': _serialize_tou_metric(meter.energy_import_meter_channel_1),
        'allocated_export_energy_credits': _serialize_tou_metric(meter.allocated_export_energy_credits),
        'net_energy_usage_after_credits': _serialize_tou_metric(meter.net_energy_usage_after_credits),

        # PCE TOU cost
        'pce_energy_cost': _serialize_tou_metric(meter.pce_energy_cost),

        # PCE Simple Metrics (5 fields)
        'pce_net_generation_bonus': _serialize_metric(meter.pce_net_generation_bonus),
        'pce_energy_commission_surcharge': _serialize_metric(meter.pce_energy_commission_surcharge),
        'pce_total_energy_charges': _serialize_metric(meter.pce_total_energy_charges),
        'pce_nem_credit': _serialize_metric(meter.pce_nem_credit),
        'pce_generation_charges_due_cash': _serialize_metric(meter.pce_generation_charges_due_cash),

        # PG&E Metrics (8 fields)
        'pge_res_energy_charges': _serialize_metric(meter.pge_res_energy_charges),
        'pge_baseline_credit': _serialize_metric(meter.pge_baseline_credit),
        'pge_da_cca_charges': _serialize_metric(meter.pge_da_cca_charges),
        'pge_total_energy_charges': _serialize_metric(meter.pge_total_energy_charges),
        'pge_nem_billing': _serialize_metric(meter.pge_nem_billing),
        'pge_minimum_delivery_charge': _serialize_metric(meter.pge_minimum_delivery_charge),
        'pge_nem_true_up_adjustment': _serialize_metric(meter.pge_nem_true_up_adjustment),
        'pge_electric_delivery_charges': _serialize_metric(meter.pge_electric_delivery_charges),

        # Totals (2 fields)
        'california_climate_credit': _serialize_metric(meter.california_climate_credit),
        'total_bill_in_mail': _serialize_metric(meter.total_bill_in_mail),

        # Allocation fields (4 fields)
        'allocation_import_percentage': _serialize_metric(meter.allocation_import_percentage),
        'allocation_credits_percentage': _serialize_metric(meter.allocation_credits_percentage),
        'allocation_cumulative_energy': _serialize_metric(meter.allocation_cumulative_energy),
        'allocation_cumulative_percentage': _serialize_metric(meter.allocation_cumulative_percentage),
    }


def _serialize_date(date: EnergyDate) -> dict:
    """Serialize EnergyDate to dict."""
    return {'value': date.value} if date and date.value else {'value': ''}


def _serialize_tou_metric(tou: EnergyMetricTOU) -> dict:
    """
    Serialize EnergyMetricTOU (Time-of-Use metric) to dict.

    Returns dict with peak, off_peak, and total, each having value and subcomponent_values.
    """
    if not tou:
        return {
            'peak': None,
            'off_peak': None,
            'total': None
        }

    return {
        'peak': _serialize_metric(tou.peak),
        'off_peak': _serialize_metric(tou.off_peak),
        'total': _serialize_metric(tou.total)
    }


def _serialize_metric(metric: EnergyMetric) -> dict:
    """
    Serialize EnergyMetric to dict with calculated value field.

    Returns:
        Dict with:
        - subcomponent_values: Original array of values
        - value: Sum of subcomponent_values (convenience field for frontend)
    """
    if not metric:
        return {
            'subcomponent_values': [],
            'value': None
        }

    subcomponents = metric.subcomponent_values if metric.subcomponent_values else []

    # Calculate total value (sum of subcomponents)
    value = sum(subcomponents) if subcomponents else None

    return {
        'subcomponent_values': subcomponents,
        'value': value
    }


def _get_nested_value(data: dict, *keys) -> float | None:
    """
    Get a nested value from a dict using a path of keys.

    Example: _get_nested_value(meter, 'energy_import_meter_channel_1', 'total', 'value')

    Args:
        data: Dictionary to traverse
        *keys: Sequence of keys to traverse

    Returns:
        The value at the end of the path, or None if any key is missing
    """
    current = data
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def _add_cumulative_allocation_percentages(billing_months: list[dict]) -> None:
    """
    Calculate and add allocation_cumulative_energy and allocation_cumulative_percentage to all months.

    This calculates running cumulative totals month by month. Each month shows the cumulative
    total up to and including that month.

    Args:
        billing_months: List of serialized billing month dicts (modified in place)
    """
    if not billing_months:
        return

    # Track running cumulative totals
    main_cumulative = 0.0
    adu_cumulative = 0.0

    for month in billing_months:
        # Get this month's import energy
        main_import = _get_nested_value(month, 'main', 'energy_import_meter_channel_1', 'total', 'value')
        adu_import = _get_nested_value(month, 'adu', 'energy_import_meter_channel_1', 'total', 'value')

        # Add to running totals
        if main_import is not None:
            main_cumulative += main_import
        if adu_import is not None:
            adu_cumulative += adu_import

        # Calculate cumulative total and percentages for this month
        total_cumulative = main_cumulative + adu_cumulative
        main_cumulative_pct = calculate_allocation_cumulative_percentage(main_cumulative, total_cumulative)
        adu_cumulative_pct = calculate_allocation_cumulative_percentage(adu_cumulative, total_cumulative)

        # Add running cumulative values to this month
        if month.get('main'):
            month['main']['allocation_cumulative_energy'] = {'value': main_cumulative}
            if main_cumulative_pct is not None:
                month['main']['allocation_cumulative_percentage'] = {'value': main_cumulative_pct}

        if month.get('adu'):
            month['adu']['allocation_cumulative_energy'] = {'value': adu_cumulative}
            if adu_cumulative_pct is not None:
                month['adu']['allocation_cumulative_percentage'] = {'value': adu_cumulative_pct}
