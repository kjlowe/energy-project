#!/usr/bin/env python3
"""
Verification script to prove that calculated values in billing_calculations.py
match the values stored in the database.

This script:
1. Loads raw data from the database
2. Manually applies calculations from billing_calculations.py
3. Compares calculated values to database values
4. Reports any discrepancies
"""

from models import DatabaseManager
from billing_calculations import (
    calculate_main_allocation_percentage,
    calculate_generation_energy_export_peak,
    calculate_generation_energy_export_off_peak,
    calculate_pce_energy_cost_total,
    calculate_pce_total_energy_charges,
    calculate_total_bill_in_mail,
    calculate_benefit_allocated_export_peak,
    calculate_benefit_allocated_export_off_peak,
    calculate_benefit_energy_import_peak,
    calculate_benefit_energy_import_off_peak,
)
from proto_utils import proto_to_dict
from proto.billing import BillingYear
from typing import Optional, Dict, Any, List, Tuple
import sys


# ANSI color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def get_value(data: Any, *keys) -> Optional[float]:
    """Extract value from nested dict structure."""
    if data is None:
        return None

    current = data
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
            if current is None:
                return None
        else:
            return None

    if isinstance(current, dict):
        return current.get('value')

    return None


def verify_generation_meter_calculations(
    meter_data: Dict[str, Any],
    month_label: str
) -> Tuple[int, int, List[str]]:
    """
    Verify all calculations for a generation meter.

    Returns:
        Tuple of (passed_count, failed_count, error_messages)
    """
    passed = 0
    failed = 0
    errors = []

    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}Generation Meter - {month_label}{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")

    # Extract source values
    allocated_export = meter_data.get('allocated_export_energy_credits', {})
    energy_export = meter_data.get('energy_export_meter_channel_2', {})
    pce_energy_cost = meter_data.get('pce_energy_cost', {})

    # Test 1: main_allocation_percentage (not stored, but used in other calculations)
    main_allocation_pct = calculate_main_allocation_percentage(
        get_value(allocated_export, 'total'),
        get_value(energy_export, 'total')
    )
    if main_allocation_pct is not None:
        print(f"  Main Allocation %: {main_allocation_pct:.6f}")

    # Test 2: energy_export_meter_channel_2.peak
    calc_peak = calculate_generation_energy_export_peak(
        get_value(allocated_export, 'peak'),
        main_allocation_pct
    )
    db_peak = get_value(energy_export, 'peak')

    if calc_peak is not None:
        match = abs(calc_peak - (db_peak or 0)) < 0.01 if db_peak is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} energy_export.peak: {calc_peak:.2f} kWh")
            passed += 1
        else:
            msg = f"energy_export.peak: calculated={calc_peak:.2f}, db={db_peak}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 3: energy_export_meter_channel_2.off_peak
    calc_off_peak = calculate_generation_energy_export_off_peak(
        get_value(allocated_export, 'off_peak'),
        main_allocation_pct
    )
    db_off_peak = get_value(energy_export, 'off_peak')

    if calc_off_peak is not None:
        match = abs(calc_off_peak - (db_off_peak or 0)) < 0.01 if db_off_peak is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} energy_export.off_peak: {calc_off_peak:.2f} kWh")
            passed += 1
        else:
            msg = f"energy_export.off_peak: calculated={calc_off_peak:.2f}, db={db_off_peak}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 4: pce_energy_cost.total
    calc_pce_total = calculate_pce_energy_cost_total(
        get_value(pce_energy_cost, 'peak'),
        get_value(pce_energy_cost, 'off_peak')
    )
    db_pce_total = get_value(pce_energy_cost, 'total')

    if calc_pce_total is not None:
        match = abs(calc_pce_total - (db_pce_total or 0)) < 0.01 if db_pce_total is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} pce_energy_cost.total: ${calc_pce_total:.2f}")
            passed += 1
        else:
            msg = f"pce_energy_cost.total: calculated=${calc_pce_total:.2f}, db=${db_pce_total}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 5: pce_total_energy_charges
    calc_pce_total_charges = calculate_pce_total_energy_charges(
        calc_pce_total,
        get_value(meter_data, 'pce_net_generation_bonus'),
        get_value(meter_data, 'pce_energy_commission_surcharge')
    )
    db_pce_total_charges = get_value(meter_data, 'pce_total_energy_charges')

    if calc_pce_total_charges is not None:
        match = abs(calc_pce_total_charges - (db_pce_total_charges or 0)) < 0.01 if db_pce_total_charges is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} pce_total_energy_charges: ${calc_pce_total_charges:.2f}")
            passed += 1
        else:
            msg = f"pce_total_energy_charges: calculated=${calc_pce_total_charges:.2f}, db=${db_pce_total_charges}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 6: total_bill_in_mail
    calc_total_bill = calculate_total_bill_in_mail(
        get_value(meter_data, 'pce_generation_charges_due_cash'),
        get_value(meter_data, 'pge_electric_delivery_charges'),
        get_value(meter_data, 'california_climate_credit')
    )
    db_total_bill = get_value(meter_data, 'total_bill_in_mail')

    if calc_total_bill is not None:
        match = abs(calc_total_bill - (db_total_bill or 0)) < 0.01 if db_total_bill is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} total_bill_in_mail: ${calc_total_bill:.2f}")
            passed += 1
        else:
            msg = f"total_bill_in_mail: calculated=${calc_total_bill:.2f}, db=${db_total_bill}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    return passed, failed, errors


def verify_benefit_meter_calculations(
    meter_data: Dict[str, Any],
    gen_meter_data: Dict[str, Any],
    month_label: str
) -> Tuple[int, int, List[str]]:
    """
    Verify all calculations for a benefit meter.

    Returns:
        Tuple of (passed_count, failed_count, error_messages)
    """
    passed = 0
    failed = 0
    errors = []

    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}Benefit Meter - {month_label}{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")

    # Extract source values
    gen_export = gen_meter_data.get('energy_export_meter_channel_2', {})
    gen_allocated = gen_meter_data.get('allocated_export_energy_credits', {})
    net_energy = meter_data.get('net_energy_usage_after_credits', {})
    allocated_export = meter_data.get('allocated_export_energy_credits', {})
    energy_import = meter_data.get('energy_import_meter_channel_1', {})
    pce_energy_cost = meter_data.get('pce_energy_cost', {})

    # Test 1: allocated_export_energy_credits.peak
    calc_allocated_peak = calculate_benefit_allocated_export_peak(
        get_value(gen_export, 'peak'),
        get_value(gen_allocated, 'peak')
    )
    db_allocated_peak = get_value(allocated_export, 'peak')

    if calc_allocated_peak is not None:
        match = abs(calc_allocated_peak - (db_allocated_peak or 0)) < 0.01 if db_allocated_peak is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} allocated_export.peak: {calc_allocated_peak:.2f} kWh")
            passed += 1
        else:
            msg = f"allocated_export.peak: calculated={calc_allocated_peak:.2f}, db={db_allocated_peak}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 2: allocated_export_energy_credits.off_peak
    calc_allocated_off_peak = calculate_benefit_allocated_export_off_peak(
        get_value(gen_export, 'off_peak'),
        get_value(gen_allocated, 'off_peak')
    )
    db_allocated_off_peak = get_value(allocated_export, 'off_peak')

    if calc_allocated_off_peak is not None:
        match = abs(calc_allocated_off_peak - (db_allocated_off_peak or 0)) < 0.01 if db_allocated_off_peak is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} allocated_export.off_peak: {calc_allocated_off_peak:.2f} kWh")
            passed += 1
        else:
            msg = f"allocated_export.off_peak: calculated={calc_allocated_off_peak:.2f}, db={db_allocated_off_peak}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 3: energy_import_meter_channel_1.peak
    calc_import_peak = calculate_benefit_energy_import_peak(
        get_value(net_energy, 'peak'),
        calc_allocated_peak  # Use calculated value as it depends on generation meter
    )
    db_import_peak = get_value(energy_import, 'peak')

    if calc_import_peak is not None:
        match = abs(calc_import_peak - (db_import_peak or 0)) < 0.01 if db_import_peak is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} energy_import.peak: {calc_import_peak:.2f} kWh")
            passed += 1
        else:
            msg = f"energy_import.peak: calculated={calc_import_peak:.2f}, db={db_import_peak}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 4: energy_import_meter_channel_1.off_peak
    calc_import_off_peak = calculate_benefit_energy_import_off_peak(
        get_value(net_energy, 'off_peak'),
        calc_allocated_off_peak  # Use calculated value
    )
    db_import_off_peak = get_value(energy_import, 'off_peak')

    if calc_import_off_peak is not None:
        match = abs(calc_import_off_peak - (db_import_off_peak or 0)) < 0.01 if db_import_off_peak is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} energy_import.off_peak: {calc_import_off_peak:.2f} kWh")
            passed += 1
        else:
            msg = f"energy_import.off_peak: calculated={calc_import_off_peak:.2f}, db={db_import_off_peak}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 5: pce_energy_cost.total
    calc_pce_total = calculate_pce_energy_cost_total(
        get_value(pce_energy_cost, 'peak'),
        get_value(pce_energy_cost, 'off_peak')
    )
    db_pce_total = get_value(pce_energy_cost, 'total')

    if calc_pce_total is not None:
        match = abs(calc_pce_total - (db_pce_total or 0)) < 0.01 if db_pce_total is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} pce_energy_cost.total: ${calc_pce_total:.2f}")
            passed += 1
        else:
            msg = f"pce_energy_cost.total: calculated=${calc_pce_total:.2f}, db=${db_pce_total}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 6: pce_total_energy_charges
    calc_pce_total_charges = calculate_pce_total_energy_charges(
        calc_pce_total,
        get_value(meter_data, 'pce_net_generation_bonus'),
        get_value(meter_data, 'pce_energy_commission_surcharge')
    )
    db_pce_total_charges = get_value(meter_data, 'pce_total_energy_charges')

    if calc_pce_total_charges is not None:
        match = abs(calc_pce_total_charges - (db_pce_total_charges or 0)) < 0.01 if db_pce_total_charges is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} pce_total_energy_charges: ${calc_pce_total_charges:.2f}")
            passed += 1
        else:
            msg = f"pce_total_energy_charges: calculated=${calc_pce_total_charges:.2f}, db=${db_pce_total_charges}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    # Test 7: total_bill_in_mail
    calc_total_bill = calculate_total_bill_in_mail(
        get_value(meter_data, 'pce_generation_charges_due_cash'),
        get_value(meter_data, 'pge_electric_delivery_charges'),
        get_value(meter_data, 'california_climate_credit')
    )
    db_total_bill = get_value(meter_data, 'total_bill_in_mail')

    if calc_total_bill is not None:
        match = abs(calc_total_bill - (db_total_bill or 0)) < 0.01 if db_total_bill is not None else False
        if match:
            print(f"  {Colors.GREEN}✓{Colors.END} total_bill_in_mail: ${calc_total_bill:.2f}")
            passed += 1
        else:
            msg = f"total_bill_in_mail: calculated=${calc_total_bill:.2f}, db=${db_total_bill}"
            print(f"  {Colors.RED}✗{Colors.END} {msg}")
            errors.append(msg)
            failed += 1

    return passed, failed, errors


def main():
    """Main verification function."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}BILLING CALCULATIONS VERIFICATION{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}\n")

    print("Loading data from database...")
    db = DatabaseManager()
    billing_years = db.get_all_billing_years()

    if not billing_years:
        print(f"{Colors.RED}No billing years found in database!{Colors.END}")
        sys.exit(1)

    print(f"Found {len(billing_years)} billing year(s)\n")

    total_passed = 0
    total_failed = 0
    all_errors = []

    for billing_year in billing_years:
        start_month = billing_year.get('start_month')
        start_year = billing_year.get('start_year')
        num_months = billing_year.get('num_months')

        print(f"\n{Colors.BOLD}Billing Year: {start_year}-{start_month} ({num_months} months){Colors.END}")

        billing_months = billing_year.get('billing_months', [])

        for i, month in enumerate(billing_months):
            month_label_obj = month.get('month_label', {})
            month_label = f"{month_label_obj.get('month_name', 'Unknown')} {month_label_obj.get('year', '')}"

            # Verify generation meter (main)
            main_meter = month.get('main')
            if main_meter and main_meter.get('nem2a_meter_type') == 'GENERATION_METER':
                passed, failed, errors = verify_generation_meter_calculations(main_meter, month_label)
                total_passed += passed
                total_failed += failed
                all_errors.extend(errors)

            # Verify benefit meter (adu)
            adu_meter = month.get('adu')
            if adu_meter and adu_meter.get('nem2a_meter_type') == 'BENEFIT_METER':
                if main_meter:
                    passed, failed, errors = verify_benefit_meter_calculations(adu_meter, main_meter, month_label)
                    total_passed += passed
                    total_failed += failed
                    all_errors.extend(errors)

    # Print summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}VERIFICATION SUMMARY{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}\n")

    print(f"  {Colors.GREEN}✓ Passed:{Colors.END} {total_passed}")
    print(f"  {Colors.RED}✗ Failed:{Colors.END} {total_failed}")
    print(f"  {Colors.BOLD}Total Tests:{Colors.END} {total_passed + total_failed}")

    if total_failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL CALCULATIONS VERIFIED SUCCESSFULLY! 🎉{Colors.END}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ VERIFICATION FAILED{Colors.END}\n")
        print(f"{Colors.RED}Errors:{Colors.END}")
        for error in all_errors:
            print(f"  - {error}")
        print()
        sys.exit(1)


if __name__ == '__main__':
    main()
