"""
Metadata loader module for billing structure metadata.

Loads JSON and converts to map-based proto structures.
Validates field names against MeterBillingMonth from billing.proto.
"""

import json
from pathlib import Path
from typing import Optional

from proto.billing import MeterBillingMonth
from proto.metadata import (
    BillingStructureMetadata,
    MeterMetadata,
    FieldMetadata,
    DateFieldMetadata,
    SimpleFieldMetadata,
    TOUFieldMetadata,
    TOUComponentMetadata,
    FieldSource,
    OptionalInt32,
    WhereFrom,
    Unit,
)

# Module-level cache
_metadata_cache: Optional[BillingStructureMetadata] = None


def load_metadata() -> BillingStructureMetadata:
    """
    Load and cache metadata from JSON, converting to proto structures.

    Returns:
        BillingStructureMetadata proto message

    Raises:
        FileNotFoundError: If metadata file doesn't exist
        ValueError: If JSON structure is invalid or fields don't match billing.proto
    """
    global _metadata_cache

    if _metadata_cache is not None:
        return _metadata_cache

    # Locate metadata file
    metadata_path = Path(__file__).parent / 'data' / 'billing_structure_metadata.json'

    if not metadata_path.exists():
        raise FileNotFoundError(f"Metadata not found: {metadata_path}")

    # Load JSON
    with open(metadata_path, 'r') as f:
        json_data = json.load(f)

    # Convert to proto with validation
    _metadata_cache = BillingStructureMetadata(
        generation_meter=_parse_meter_metadata(json_data['generation_meter'], 'generation_meter'),
        benefit_meter=_parse_meter_metadata(json_data['benefit_meter'], 'benefit_meter')
    )

    return _metadata_cache


def _parse_meter_metadata(meter_json: dict, meter_name: str) -> MeterMetadata:
    """
    Parse single meter metadata from JSON into map-based structure.

    Validates that all field names exist in MeterBillingMonth proto.
    """
    # Get valid field names from billing.proto
    proto_fields = set(MeterBillingMonth.__dataclass_fields__.keys())
    proto_fields.discard('nem2a_meter_type')  # Remove enum field (not data)

    # Validate JSON has correct fields
    json_fields = set(meter_json.keys())

    missing = proto_fields - json_fields
    extra = json_fields - proto_fields

    if missing:
        raise ValueError(f"{meter_name} missing metadata for fields: {missing}")
    if extra:
        raise ValueError(f"{meter_name} has metadata for unknown fields: {extra}")

    # Parse all fields into map
    fields_map = {}
    for field_name, field_json in meter_json.items():
        fields_map[field_name] = _parse_field_metadata(field_json, field_name)

    return MeterMetadata(fields=fields_map)


def _parse_field_metadata(field_json: dict, field_name: str) -> FieldMetadata:
    """
    Parse field metadata and infer type from JSON structure.

    Type inference:
    - Has 'peak'/'off_peak'/'total' keys → TOUFieldMetadata
    - Has 'unit' key → SimpleFieldMetadata
    - Otherwise → DateFieldMetadata
    """
    # Check structure to determine type
    if 'peak' in field_json and 'off_peak' in field_json and 'total' in field_json:
        # TOU field
        return FieldMetadata(tou_field=_parse_tou_field(field_json))
    elif 'unit' in field_json:
        # Simple field
        return FieldMetadata(simple_field=_parse_simple_field(field_json))
    else:
        # Date field (only has where_found)
        return FieldMetadata(date_field=_parse_date_field(field_json))


def _parse_date_field(field_json: dict) -> DateFieldMetadata:
    """Parse date field metadata."""
    return DateFieldMetadata(
        where_found=[_parse_source(s) for s in field_json['where_found']]
    )


def _parse_simple_field(field_json: dict) -> SimpleFieldMetadata:
    """Parse simple field metadata."""
    return SimpleFieldMetadata(
        unit=Unit[field_json['unit']],  # Enum string → enum value
        where_found=[_parse_source(s) for s in field_json['where_found']]
    )


def _parse_tou_field(field_json: dict) -> TOUFieldMetadata:
    """Parse TOU field metadata."""
    return TOUFieldMetadata(
        peak=_parse_tou_component(field_json['peak']),
        off_peak=_parse_tou_component(field_json['off_peak']),
        total=_parse_tou_component(field_json['total'])
    )


def _parse_tou_component(comp_json: dict) -> TOUComponentMetadata:
    """Parse TOU component (peak/off_peak/total)."""
    return TOUComponentMetadata(
        unit=Unit[comp_json['unit']],
        where_found=[_parse_source(s) for s in comp_json['where_found']]
    )


def _parse_source(source_json: dict) -> FieldSource:
    """Parse field source."""
    # Handle optional kevins_number_code using OptionalInt32 wrapper
    kevins_code = source_json.get('kevins_number_code')

    return FieldSource(
        where_from=WhereFrom[source_json['where_from']],
        where_on_pdf=source_json.get('where_on_pdf', ''),
        # Wrap in OptionalInt32 if not null, otherwise explicitly set to None
        kevins_number_code=OptionalInt32(value=kevins_code) if kevins_code is not None else None
    )


def clear_cache():
    """Clear the metadata cache (for testing)."""
    global _metadata_cache
    _metadata_cache = None
