"""
Validation script for billing structure metadata.

Ensures that metadata is complete and matches proto field definitions.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
from proto.billing import MeterBillingMonth, NEM2AMeterType, WhereFrom
from metadata_loader import load_metadata


def get_proto_fields() -> Set[str]:
    """
    Extract all field names from MeterBillingMonth proto using reflection.

    Returns:
        Set of field names defined in the proto
    """
    # Get all field names from the MeterBillingMonth dataclass
    # betterproto creates dataclasses with __dataclass_fields__
    if hasattr(MeterBillingMonth, '__dataclass_fields__'):
        # Get all fields except nem2a_meter_type (enum, not data field)
        proto_fields = set(MeterBillingMonth.__dataclass_fields__.keys())
        proto_fields.discard('nem2a_meter_type')  # Remove enum field
        return proto_fields
    else:
        # Fallback: manually list all 23 fields from proto
        return {
            'billing_date', 'service_end_date',
            'energy_export_meter_channel_2', 'energy_import_meter_channel_1',
            'allocated_export_energy_credits', 'net_energy_usage_after_credits',
            'pce_energy_cost', 'pce_net_generation_bonus',
            'pce_energy_commission_surcharge', 'pce_total_energy_charges',
            'pce_nem_credit', 'pce_generation_charges_due_cash',
            'pge_res_energy_charges', 'pge_baseline_credit',
            'pge_da_cca_charges', 'pge_total_energy_charges',
            'pge_nem_billing', 'pge_minimum_delivery_charge',
            'pge_nem_true_up_adjustment', 'pge_electric_delivery_charges',
            'california_climate_credit', 'total_bill_in_mail'
        }


def get_tou_fields() -> Set[str]:
    """
    Get list of fields that are EnergyMetricTOU (have peak/off_peak/total).

    Returns:
        Set of field names that should have TOU structure
    """
    return {
        'energy_export_meter_channel_2',
        'energy_import_meter_channel_1',
        'allocated_export_energy_credits',
        'net_energy_usage_after_credits',
        'pce_energy_cost'
    }


def get_date_fields() -> Set[str]:
    """
    Get list of fields that are EnergyDate (no unit needed).

    Returns:
        Set of field names that are dates
    """
    return {'billing_date', 'service_end_date'}


def validate_where_from_enums(metadata: Dict[str, Any]) -> List[str]:
    """
    Validate that all where_from values are valid WhereFrom enum values.

    Args:
        metadata: Metadata dictionary

    Returns:
        List of validation error messages
    """
    errors = []
    valid_where_from = {
        'NOT_PROVIDED', 'PDF_BILL', 'PDF_DETAIL_OF_BILL',
        'CALCULATED', 'FIXED_VALUE'
    }

    def check_where_found(field_path: str, where_found: List[Dict]):
        for idx, source in enumerate(where_found):
            where_from = source.get('where_from')
            if where_from not in valid_where_from:
                errors.append(
                    f"{field_path}: Invalid where_from value '{where_from}' "
                    f"at index {idx}. Valid values: {valid_where_from}"
                )

    for meter_type in ['GENERATION_METER', 'BENEFIT_METER']:
        if meter_type not in metadata:
            continue

        for field_name, field_data in metadata[meter_type].items():
            # Check root level where_found
            if 'where_found' in field_data:
                check_where_found(
                    f"{meter_type}.{field_name}",
                    field_data['where_found']
                )

            # Check TOU nested where_found
            for tou_key in ['peak', 'off_peak', 'total']:
                if tou_key in field_data and 'where_found' in field_data[tou_key]:
                    check_where_found(
                        f"{meter_type}.{field_name}.{tou_key}",
                        field_data[tou_key]['where_found']
                    )

    return errors


def validate_metadata() -> bool:
    """
    Run all metadata validations.

    Returns:
        True if all validations pass, False otherwise
    """
    print("=" * 60)
    print("Billing Metadata Validation")
    print("=" * 60)
    print()

    all_passed = True
    errors = []

    # Load metadata
    try:
        metadata = load_metadata()
        print("✓ Metadata file loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load metadata: {e}")
        return False

    # Get proto fields
    proto_fields = get_proto_fields()
    tou_fields = get_tou_fields()
    date_fields = get_date_fields()

    print(f"✓ Proto defines {len(proto_fields)} fields")
    print()

    # Validation 1: Both meter types exist
    print("Checking meter types...")
    if 'GENERATION_METER' not in metadata:
        errors.append("Missing GENERATION_METER key")
        all_passed = False
    else:
        print(f"  ✓ GENERATION_METER exists ({len(metadata['GENERATION_METER'])} fields)")

    if 'BENEFIT_METER' not in metadata:
        errors.append("Missing BENEFIT_METER key")
        all_passed = False
    else:
        print(f"  ✓ BENEFIT_METER exists ({len(metadata['BENEFIT_METER'])} fields)")

    print()

    # Validation 2: All proto fields have metadata entries
    for meter_type in ['GENERATION_METER', 'BENEFIT_METER']:
        if meter_type not in metadata:
            continue

        print(f"Checking {meter_type} fields...")
        metadata_fields = set(metadata[meter_type].keys())

        missing_fields = proto_fields - metadata_fields
        if missing_fields:
            errors.append(
                f"{meter_type}: Missing metadata for fields: {missing_fields}"
            )
            all_passed = False
            for field in missing_fields:
                print(f"  ❌ Missing: {field}")
        else:
            print(f"  ✓ All {len(proto_fields)} proto fields have metadata")

        extra_fields = metadata_fields - proto_fields
        if extra_fields:
            errors.append(
                f"{meter_type}: Extra fields not in proto: {extra_fields}"
            )
            all_passed = False
            for field in extra_fields:
                print(f"  ⚠ Extra: {field}")

        print()

    # Validation 3: TOU fields have peak/off_peak/total structure
    print("Checking TOU field structure...")
    for meter_type in ['GENERATION_METER', 'BENEFIT_METER']:
        if meter_type not in metadata:
            continue

        for field_name in tou_fields:
            if field_name not in metadata[meter_type]:
                continue

            field_data = metadata[meter_type][field_name]
            for tou_key in ['peak', 'off_peak', 'total']:
                if tou_key not in field_data:
                    errors.append(
                        f"{meter_type}.{field_name}: Missing {tou_key} subfield"
                    )
                    all_passed = False
                    print(f"  ❌ {meter_type}.{field_name}: Missing {tou_key}")

    if all_passed:
        print(f"  ✓ All TOU fields have peak/off_peak/total structure")
    print()

    # Validation 4: Leaf nodes have unit (except dates)
    print("Checking unit fields...")
    unit_errors = []
    for meter_type in ['GENERATION_METER', 'BENEFIT_METER']:
        if meter_type not in metadata:
            continue

        for field_name, field_data in metadata[meter_type].items():
            # Date fields should not have unit
            if field_name in date_fields:
                if 'unit' in field_data:
                    unit_errors.append(
                        f"{meter_type}.{field_name}: Date field should not have unit"
                    )
                continue

            # TOU fields: check nested unit
            if field_name in tou_fields:
                for tou_key in ['peak', 'off_peak', 'total']:
                    if tou_key in field_data:
                        if 'unit' not in field_data[tou_key]:
                            unit_errors.append(
                                f"{meter_type}.{field_name}.{tou_key}: Missing unit"
                            )
            else:
                # Simple fields: check root level unit
                if 'unit' not in field_data:
                    unit_errors.append(
                        f"{meter_type}.{field_name}: Missing unit"
                    )

    if unit_errors:
        errors.extend(unit_errors)
        all_passed = False
        for error in unit_errors:
            print(f"  ❌ {error}")
    else:
        print("  ✓ All leaf nodes have unit (except dates)")
    print()

    # Validation 5: where_found arrays are non-empty
    print("Checking where_found arrays...")
    where_found_errors = []
    for meter_type in ['GENERATION_METER', 'BENEFIT_METER']:
        if meter_type not in metadata:
            continue

        for field_name, field_data in metadata[meter_type].items():
            # Check root level where_found
            if field_name in tou_fields:
                # TOU fields: check nested where_found
                for tou_key in ['peak', 'off_peak', 'total']:
                    if tou_key in field_data:
                        if 'where_found' not in field_data[tou_key]:
                            where_found_errors.append(
                                f"{meter_type}.{field_name}.{tou_key}: Missing where_found"
                            )
                        elif not field_data[tou_key]['where_found']:
                            where_found_errors.append(
                                f"{meter_type}.{field_name}.{tou_key}: where_found is empty"
                            )
            else:
                # Simple fields: check root level
                if 'where_found' not in field_data:
                    where_found_errors.append(
                        f"{meter_type}.{field_name}: Missing where_found"
                    )
                elif not field_data['where_found']:
                    where_found_errors.append(
                        f"{meter_type}.{field_name}: where_found is empty"
                    )

    if where_found_errors:
        errors.extend(where_found_errors)
        all_passed = False
        for error in where_found_errors:
            print(f"  ❌ {error}")
    else:
        print("  ✓ All fields have non-empty where_found arrays")
    print()

    # Validation 6: where_from enum values
    print("Checking where_from enum values...")
    enum_errors = validate_where_from_enums(metadata)
    if enum_errors:
        errors.extend(enum_errors)
        all_passed = False
        for error in enum_errors:
            print(f"  ❌ {error}")
    else:
        print("  ✓ All where_from values are valid enums")
    print()

    # Summary
    print("=" * 60)
    if all_passed:
        print("✓ All validations passed!")
        print("=" * 60)
        return True
    else:
        print(f"❌ Validation failed with {len(errors)} error(s)")
        print("=" * 60)
        print()
        print("Errors:")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
        return False


def main():
    """Run validation and exit with appropriate code."""
    success = validate_metadata()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
