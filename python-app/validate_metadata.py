"""Enhanced validation using map-based proto structures."""

import betterproto
from proto.metadata import BillingStructureMetadata, WhereFrom, Unit
from metadata_loader import load_metadata


def validate_metadata() -> bool:
    """Validate metadata using proto validation."""
    print("=" * 60)
    print("Billing Metadata Validation (Map-Based Proto)")
    print("=" * 60)
    print()

    # Test 1: Load and parse (includes field name validation)
    try:
        metadata: BillingStructureMetadata = load_metadata()
        print("✓ Metadata loaded successfully")
        print("  - Field names validated against billing.proto")
        print("  - Proto structure validated")
    except Exception as e:
        print(f"❌ Failed to load metadata: {e}")
        return False

    # Test 2: Semantic validations
    errors = []
    errors.extend(_validate_where_found_arrays(metadata))
    errors.extend(_validate_enum_values(metadata))
    errors.extend(_validate_unit_correctness(metadata))

    if errors:
        print(f"\n❌ Validation failed with {len(errors)} error(s):")
        for error in errors:
            print(f"  - {error}")
        return False

    print("\n✅ All validations passed!")
    return True


def _validate_where_found_arrays(metadata: BillingStructureMetadata) -> list:
    """Ensure all where_found arrays have at least one entry."""
    errors = []

    for meter_name, meter in [
        ('generation_meter', metadata.generation_meter),
        ('benefit_meter', metadata.benefit_meter)
    ]:
        # Iterate through all fields in the map
        for field_name, field_metadata in meter.fields.items():
            # Use betterproto's which_one_of to detect the actual field type
            field_type, field_value = betterproto.which_one_of(field_metadata, 'metadata')

            if field_type == 'date_field':
                if not field_value.where_found:
                    errors.append(f"{meter_name}.{field_name} has empty where_found")
            elif field_type == 'simple_field':
                if not field_value.where_found:
                    errors.append(f"{meter_name}.{field_name} has empty where_found")
            elif field_type == 'tou_field':
                if not field_value.peak.where_found:
                    errors.append(f"{meter_name}.{field_name}.peak has empty where_found")
                if not field_value.off_peak.where_found:
                    errors.append(f"{meter_name}.{field_name}.off_peak has empty where_found")
                if not field_value.total.where_found:
                    errors.append(f"{meter_name}.{field_name}.total has empty where_found")

    return errors


def _validate_enum_values(metadata: BillingStructureMetadata) -> list:
    """Validate enum values are not UNSPECIFIED."""
    errors = []

    for meter_name, meter in [
        ('generation_meter', metadata.generation_meter),
        ('benefit_meter', metadata.benefit_meter)
    ]:
        for field_name, field_metadata in meter.fields.items():
            # Use betterproto's which_one_of to detect the actual field type
            field_type, field_value = betterproto.which_one_of(field_metadata, 'metadata')

            if field_type == 'simple_field':
                if field_value.unit == Unit.UNIT_UNSPECIFIED:
                    errors.append(f"{meter_name}.{field_name} has UNIT_UNSPECIFIED")
            elif field_type == 'tou_field':
                if field_value.peak.unit == Unit.UNIT_UNSPECIFIED:
                    errors.append(f"{meter_name}.{field_name}.peak has UNIT_UNSPECIFIED")
                if field_value.off_peak.unit == Unit.UNIT_UNSPECIFIED:
                    errors.append(f"{meter_name}.{field_name}.off_peak has UNIT_UNSPECIFIED")
                if field_value.total.unit == Unit.UNIT_UNSPECIFIED:
                    errors.append(f"{meter_name}.{field_name}.total has UNIT_UNSPECIFIED")

    return errors


def _validate_unit_correctness(metadata: BillingStructureMetadata) -> list:
    """Validate units match expected types (energy=kWh, cost=$)."""
    errors = []

    # Energy fields should have KILOWATT_HOURS
    energy_fields = {
        'energy_export_meter_channel_2',
        'energy_import_meter_channel_1',
        'allocated_export_energy_credits',
        'net_energy_usage_after_credits'
    }

    for meter_name, meter in [
        ('generation_meter', metadata.generation_meter),
        ('benefit_meter', metadata.benefit_meter)
    ]:
        for field_name, field_metadata in meter.fields.items():
            # Use betterproto's which_one_of to detect the actual field type
            field_type, field_value = betterproto.which_one_of(field_metadata, 'metadata')

            # Skip date fields (no unit)
            if field_type == 'date_field':
                continue

            # Determine expected unit based on field name
            if field_name in energy_fields:
                expected_unit = Unit.KILOWATT_HOURS
                unit_name = "kWh"
            else:
                expected_unit = Unit.DOLLARS
                unit_name = "$"

            # Validate based on field type
            if field_type == 'simple_field':
                if field_value.unit != expected_unit:
                    errors.append(f"{meter_name}.{field_name} should be {unit_name}")
            elif field_type == 'tou_field':
                if field_value.peak.unit != expected_unit:
                    errors.append(f"{meter_name}.{field_name}.peak should be {unit_name}")
                if field_value.off_peak.unit != expected_unit:
                    errors.append(f"{meter_name}.{field_name}.off_peak should be {unit_name}")
                if field_value.total.unit != expected_unit:
                    errors.append(f"{meter_name}.{field_name}.total should be {unit_name}")

    return errors


if __name__ == '__main__':
    success = validate_metadata()
    exit(0 if success else 1)
