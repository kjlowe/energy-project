"""
Runtime billing calculations for NEM2A meters.

All calculations are performed on data read from the database.
This module contains pure functions with no side effects.

Calculation formulas:
- Generation meter: energy exports, PCE costs, total bill
- Benefit meter: allocated credits, energy imports, PCE costs, total bill
- Dependencies: Generation meter must be calculated before benefit meter
"""

from typing import Optional, Dict, Any


# ============================================================================
# HELPER CALCULATIONS
# ============================================================================

def calculate_main_allocation_percentage(
    allocated_export_total: Optional[float],
    energy_export_total: Optional[float]
) -> Optional[float]:
    """
    Calculate main_allocation_percentage.

    Formula: allocated_export_energy_credits.total / energy_export_meter_channel_2.total

    Args:
        allocated_export_total: Total export credits allocated to main meter
        energy_export_total: Total energy exported from channel 2

    Returns:
        Allocation percentage, or None if calculation cannot be performed
    """
    if allocated_export_total is None or energy_export_total is None:
        return None

    if energy_export_total == 0:
        return None  # Avoid division by zero

    return allocated_export_total / energy_export_total


# ============================================================================
# GENERATION METER CALCULATIONS
# ============================================================================

def calculate_generation_energy_export_peak(
    allocated_export_credits_peak: Optional[float],
    main_allocation_percentage: Optional[float]
) -> Optional[float]:
    """
    Calculate energy_export_meter_channel_2.peak for Generation Meter.

    Formula: allocated_export_energy_credits.peak / main_allocation_percentage

    Args:
        allocated_export_credits_peak: Peak export credits allocated
        main_allocation_percentage: Main meter allocation percentage

    Returns:
        Calculated peak export energy, or None if inputs are None or percentage is 0
    """
    if allocated_export_credits_peak is None or main_allocation_percentage is None:
        return None

    if main_allocation_percentage == 0:
        return None  # Avoid division by zero

    return allocated_export_credits_peak / main_allocation_percentage


def calculate_generation_energy_export_off_peak(
    allocated_export_credits_off_peak: Optional[float],
    main_allocation_percentage: Optional[float]
) -> Optional[float]:
    """
    Calculate energy_export_meter_channel_2.off_peak for Generation Meter.

    Formula: allocated_export_energy_credits.off_peak / main_allocation_percentage

    Args:
        allocated_export_credits_off_peak: Off-peak export credits allocated
        main_allocation_percentage: Main meter allocation percentage

    Returns:
        Calculated off-peak export energy, or None if inputs are None or percentage is 0
    """
    if allocated_export_credits_off_peak is None or main_allocation_percentage is None:
        return None

    if main_allocation_percentage == 0:
        return None  # Avoid division by zero

    return allocated_export_credits_off_peak / main_allocation_percentage


def calculate_pce_energy_cost_total(
    pce_energy_cost_peak: Optional[float],
    pce_energy_cost_off_peak: Optional[float]
) -> Optional[float]:
    """
    Calculate pce_energy_cost.total.

    Formula: pce_energy_cost.peak + pce_energy_cost.off_peak

    Args:
        pce_energy_cost_peak: PCE energy cost for peak hours
        pce_energy_cost_off_peak: PCE energy cost for off-peak hours

    Returns:
        Sum of peak and off-peak costs, or None if both inputs are None
    """
    if pce_energy_cost_peak is None and pce_energy_cost_off_peak is None:
        return None

    peak = pce_energy_cost_peak or 0
    off_peak = pce_energy_cost_off_peak or 0

    return peak + off_peak


def calculate_pce_total_energy_charges(
    pce_energy_cost_total: Optional[float],
    pce_net_generation_bonus: Optional[float],
    pce_energy_commission_surcharge: Optional[float]
) -> Optional[float]:
    """
    Calculate pce_total_energy_charges.

    Formula: pce_energy_cost.total + pce_net_generation_bonus + pce_energy_commission_surcharge

    Args:
        pce_energy_cost_total: Total PCE energy cost (peak + off-peak)
        pce_net_generation_bonus: PCE net generation bonus
        pce_energy_commission_surcharge: PCE energy commission surcharge

    Returns:
        Sum of all PCE energy charges, or None if all inputs are None
    """
    # Start with 0, add non-None values
    total = 0.0
    has_value = False

    if pce_energy_cost_total is not None:
        total += pce_energy_cost_total
        has_value = True

    if pce_net_generation_bonus is not None:
        total += pce_net_generation_bonus
        has_value = True

    if pce_energy_commission_surcharge is not None:
        total += pce_energy_commission_surcharge
        has_value = True

    return total if has_value else None


def calculate_total_bill_in_mail(
    pce_generation_charges_due_cash: Optional[float],
    pge_electric_delivery_charges: Optional[float],
    california_climate_credit: Optional[float]
) -> Optional[float]:
    """
    Calculate total_bill_in_mail.

    Formula: pce_generation_charges_due_cash + pge_electric_delivery_charges + california_climate_credit

    Args:
        pce_generation_charges_due_cash: PCE generation charges due in cash
        pge_electric_delivery_charges: PG&E electric delivery charges
        california_climate_credit: California climate credit

    Returns:
        Total bill amount, or None if all inputs are None
    """
    total = 0.0
    has_value = False

    if pce_generation_charges_due_cash is not None:
        total += pce_generation_charges_due_cash
        has_value = True

    if pge_electric_delivery_charges is not None:
        total += pge_electric_delivery_charges
        has_value = True

    if california_climate_credit is not None:
        total += california_climate_credit
        has_value = True

    return total if has_value else None


# ============================================================================
# BENEFIT METER CALCULATIONS
# ============================================================================

def calculate_benefit_allocated_export_peak(
    generation_export_peak: Optional[float],
    generation_allocated_export_peak: Optional[float]
) -> Optional[float]:
    """
    Calculate allocated_export_energy_credits.peak for Benefit Meter.

    Formula: generation_meter.energy_export_meter_channel_2.peak -
             generation_meter.allocated_export_energy_credits.peak

    Args:
        generation_export_peak: Value from generation meter's export channel 2
        generation_allocated_export_peak: Value from generation meter's allocated credits

    Returns:
        Leftover export credits for benefit meter, or None if inputs are None
    """
    if generation_export_peak is None and generation_allocated_export_peak is None:
        return None

    export = generation_export_peak or 0
    allocated = generation_allocated_export_peak or 0

    return export - allocated


def calculate_benefit_allocated_export_off_peak(
    generation_export_off_peak: Optional[float],
    generation_allocated_export_off_peak: Optional[float]
) -> Optional[float]:
    """
    Calculate allocated_export_energy_credits.off_peak for Benefit Meter.

    Formula: generation_meter.energy_export_meter_channel_2.off_peak -
             generation_meter.allocated_export_energy_credits.off_peak

    Args:
        generation_export_off_peak: Value from generation meter's export channel 2
        generation_allocated_export_off_peak: Value from generation meter's allocated credits

    Returns:
        Leftover export credits for benefit meter, or None if inputs are None
    """
    if generation_export_off_peak is None and generation_allocated_export_off_peak is None:
        return None

    export = generation_export_off_peak or 0
    allocated = generation_allocated_export_off_peak or 0

    return export - allocated


def calculate_benefit_energy_import_peak(
    net_energy_usage_peak: Optional[float],
    allocated_export_credits_peak: Optional[float]
) -> Optional[float]:
    """
    Calculate energy_import_meter_channel_1.peak for Benefit Meter.

    Formula: net_energy_usage_after_credits.peak - allocated_export_energy_credits.peak

    Args:
        net_energy_usage_peak: Net energy usage after credits for peak hours
        allocated_export_credits_peak: Allocated export credits for peak hours

    Returns:
        Energy import for peak hours, or None if inputs are None
    """
    if net_energy_usage_peak is None and allocated_export_credits_peak is None:
        return None

    usage = net_energy_usage_peak or 0
    credits = allocated_export_credits_peak or 0

    return usage - credits


def calculate_benefit_energy_import_off_peak(
    net_energy_usage_off_peak: Optional[float],
    allocated_export_credits_off_peak: Optional[float]
) -> Optional[float]:
    """
    Calculate energy_import_meter_channel_1.off_peak for Benefit Meter.

    Formula: net_energy_usage_after_credits.off_peak - allocated_export_energy_credits.off_peak

    Args:
        net_energy_usage_off_peak: Net energy usage after credits for off-peak hours
        allocated_export_credits_off_peak: Allocated export credits for off-peak hours

    Returns:
        Energy import for off-peak hours, or None if inputs are None
    """
    if net_energy_usage_off_peak is None and allocated_export_credits_off_peak is None:
        return None

    usage = net_energy_usage_off_peak or 0
    credits = allocated_export_credits_off_peak or 0

    return usage - credits


# ============================================================================
# ORCHESTRATION FUNCTIONS
# ============================================================================

def calculate_meter_values(meter_data: Dict[str, Any], generation_meter_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Calculate all runtime values for a meter.

    This is the main entry point that orchestrates all calculations.

    Args:
        meter_data: Serialized meter data dictionary (from _serialize_meter)
        generation_meter_data: For benefit meters, the generation meter data (for cross-meter calculations)

    Returns:
        Dictionary with calculated values to merge into the serialized data
    """
    if not meter_data:
        return {}

    meter_type = meter_data.get('nem2a_meter_type')
    calculated = {}

    if meter_type == 'GENERATION_METER':
        calculated = _calculate_generation_meter(meter_data)
    elif meter_type == 'BENEFIT_METER':
        calculated = _calculate_benefit_meter(meter_data, generation_meter_data)

    return calculated


def _calculate_generation_meter(meter_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate all values for generation meter."""
    calculated = {}

    # Extract source values (from PDF)
    allocated_export = meter_data.get('allocated_export_energy_credits', {})
    energy_export = meter_data.get('energy_export_meter_channel_2', {})
    pce_energy_cost = meter_data.get('pce_energy_cost', {})

    # Step 1: Calculate main_allocation_percentage
    main_allocation_pct = calculate_main_allocation_percentage(
        _get_value(allocated_export, 'total'),
        _get_value(energy_export, 'total')
    )

    # Step 2: Calculate energy_export_meter_channel_2.peak and off_peak
    export_peak = calculate_generation_energy_export_peak(
        _get_value(allocated_export, 'peak'),
        main_allocation_pct
    )
    export_off_peak = calculate_generation_energy_export_off_peak(
        _get_value(allocated_export, 'off_peak'),
        main_allocation_pct
    )

    if export_peak is not None or export_off_peak is not None:
        calculated['energy_export_meter_channel_2'] = {}
        if export_peak is not None:
            calculated['energy_export_meter_channel_2']['peak'] = {'value': export_peak}
        if export_off_peak is not None:
            calculated['energy_export_meter_channel_2']['off_peak'] = {'value': export_off_peak}

    # Step 3: Calculate pce_energy_cost.total
    pce_cost_total = calculate_pce_energy_cost_total(
        _get_value(pce_energy_cost, 'peak'),
        _get_value(pce_energy_cost, 'off_peak')
    )

    if pce_cost_total is not None:
        calculated['pce_energy_cost'] = {'total': {'value': pce_cost_total}}

    # Step 4: Calculate pce_total_energy_charges
    pce_total = calculate_pce_total_energy_charges(
        pce_cost_total,
        _get_value(meter_data.get('pce_net_generation_bonus')),
        _get_value(meter_data.get('pce_energy_commission_surcharge'))
    )

    if pce_total is not None:
        calculated['pce_total_energy_charges'] = {'value': pce_total}

    # Step 5: Calculate total_bill_in_mail
    total_bill = calculate_total_bill_in_mail(
        _get_value(meter_data.get('pce_generation_charges_due_cash')),
        _get_value(meter_data.get('pge_electric_delivery_charges')),
        _get_value(meter_data.get('california_climate_credit'))
    )

    if total_bill is not None:
        calculated['total_bill_in_mail'] = {'value': total_bill}

    return calculated


def _calculate_benefit_meter(meter_data: Dict[str, Any], generation_meter_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate all values for benefit meter."""
    calculated = {}

    if not generation_meter_data:
        return calculated  # Can't calculate without generation meter data

    # Extract source values
    net_energy = meter_data.get('net_energy_usage_after_credits', {})
    gen_export = generation_meter_data.get('energy_export_meter_channel_2', {})
    gen_allocated = generation_meter_data.get('allocated_export_energy_credits', {})

    # Step 1: Calculate allocated_export_energy_credits from generation meter
    allocated_peak = calculate_benefit_allocated_export_peak(
        _get_value(gen_export, 'peak'),
        _get_value(gen_allocated, 'peak')
    )
    allocated_off_peak = calculate_benefit_allocated_export_off_peak(
        _get_value(gen_export, 'off_peak'),
        _get_value(gen_allocated, 'off_peak')
    )

    if allocated_peak is not None or allocated_off_peak is not None:
        calculated['allocated_export_energy_credits'] = {}
        if allocated_peak is not None:
            calculated['allocated_export_energy_credits']['peak'] = {'value': allocated_peak}
        if allocated_off_peak is not None:
            calculated['allocated_export_energy_credits']['off_peak'] = {'value': allocated_off_peak}

    # Step 2: Calculate energy_import_meter_channel_1 using calculated allocated values
    import_peak = calculate_benefit_energy_import_peak(
        _get_value(net_energy, 'peak'),
        allocated_peak
    )
    import_off_peak = calculate_benefit_energy_import_off_peak(
        _get_value(net_energy, 'off_peak'),
        allocated_off_peak
    )

    if import_peak is not None or import_off_peak is not None:
        calculated['energy_import_meter_channel_1'] = {}
        if import_peak is not None:
            calculated['energy_import_meter_channel_1']['peak'] = {'value': import_peak}
        if import_off_peak is not None:
            calculated['energy_import_meter_channel_1']['off_peak'] = {'value': import_off_peak}

    # Step 3: Calculate pce_energy_cost.total (same as generation)
    pce_energy_cost = meter_data.get('pce_energy_cost', {})
    pce_cost_total = calculate_pce_energy_cost_total(
        _get_value(pce_energy_cost, 'peak'),
        _get_value(pce_energy_cost, 'off_peak')
    )

    if pce_cost_total is not None:
        calculated['pce_energy_cost'] = {'total': {'value': pce_cost_total}}

    # Step 4: Calculate pce_total_energy_charges (same as generation)
    pce_total = calculate_pce_total_energy_charges(
        pce_cost_total,
        _get_value(meter_data.get('pce_net_generation_bonus')),
        _get_value(meter_data.get('pce_energy_commission_surcharge'))
    )

    if pce_total is not None:
        calculated['pce_total_energy_charges'] = {'value': pce_total}

    # Step 5: Calculate total_bill_in_mail (same as generation)
    total_bill = calculate_total_bill_in_mail(
        _get_value(meter_data.get('pce_generation_charges_due_cash')),
        _get_value(meter_data.get('pge_electric_delivery_charges')),
        _get_value(meter_data.get('california_climate_credit'))
    )

    if total_bill is not None:
        calculated['total_bill_in_mail'] = {'value': total_bill}

    return calculated


def _get_value(data: Any, key: Optional[str] = None) -> Optional[float]:
    """
    Extract value from nested dict structure.

    Args:
        data: Dictionary or None
        key: Optional key to access (for TOU metrics)

    Returns:
        Float value or None
    """
    if data is None:
        return None

    if key:
        data = data.get(key)
        if data is None:
            return None

    if isinstance(data, dict):
        return data.get('value')

    return None
