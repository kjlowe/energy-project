"""
Unit tests for metadata_loader module.
"""

import pytest
import json
from pathlib import Path
import metadata_loader


class TestMetadataLoader:
    """Tests for metadata loading and caching."""

    def setup_method(self):
        """Clear cache before each test."""
        metadata_loader.clear_cache()

    def test_load_metadata_returns_dict(self):
        """Verify metadata loads as dictionary."""
        metadata = metadata_loader.load_metadata()
        assert isinstance(metadata, dict)

    def test_load_metadata_caching(self):
        """Verify metadata loads once and caches."""
        # First load
        metadata1 = metadata_loader.load_metadata()

        # Second load should return same object (cached)
        metadata2 = metadata_loader.load_metadata()

        # Should be the exact same object in memory
        assert metadata1 is metadata2

    def test_metadata_has_generation_meter(self):
        """Check GENERATION_METER key exists."""
        metadata = metadata_loader.load_metadata()
        assert 'GENERATION_METER' in metadata

    def test_metadata_has_benefit_meter(self):
        """Check BENEFIT_METER key exists."""
        metadata = metadata_loader.load_metadata()
        assert 'BENEFIT_METER' in metadata

    def test_metadata_structure_is_dict_not_array(self):
        """Verify new format uses dict, not array."""
        metadata = metadata_loader.load_metadata()

        # Should be dict with field names as keys
        assert isinstance(metadata['GENERATION_METER'], dict)
        assert isinstance(metadata['BENEFIT_METER'], dict)

        # Should not be array
        assert not isinstance(metadata['GENERATION_METER'], list)
        assert not isinstance(metadata['BENEFIT_METER'], list)

    def test_generation_meter_has_fields(self):
        """Verify GENERATION_METER has expected fields."""
        metadata = metadata_loader.load_metadata()
        gen_meter = metadata['GENERATION_METER']

        # Check some known fields exist
        assert 'billing_date' in gen_meter
        assert 'pce_energy_cost' in gen_meter
        assert 'total_bill_in_mail' in gen_meter

    def test_benefit_meter_has_fields(self):
        """Verify BENEFIT_METER has expected fields."""
        metadata = metadata_loader.load_metadata()
        ben_meter = metadata['BENEFIT_METER']

        # Check some known fields exist
        assert 'billing_date' in ben_meter
        assert 'pce_energy_cost' in ben_meter
        assert 'total_bill_in_mail' in ben_meter

    def test_date_field_structure(self):
        """Verify date fields have where_found but no unit."""
        metadata = metadata_loader.load_metadata()
        billing_date = metadata['GENERATION_METER']['billing_date']

        # Should have where_found
        assert 'where_found' in billing_date
        assert isinstance(billing_date['where_found'], list)
        assert len(billing_date['where_found']) > 0

        # Should NOT have unit (it's a date)
        assert 'unit' not in billing_date

    def test_simple_metric_field_structure(self):
        """Verify simple metric fields have unit and where_found."""
        metadata = metadata_loader.load_metadata()
        climate_credit = metadata['GENERATION_METER']['california_climate_credit']

        # Should have unit
        assert 'unit' in climate_credit
        assert climate_credit['unit'] == '$'

        # Should have where_found
        assert 'where_found' in climate_credit
        assert isinstance(climate_credit['where_found'], list)

    def test_tou_metric_field_structure(self):
        """Verify TOU metric fields have peak/off_peak/total structure."""
        metadata = metadata_loader.load_metadata()
        pce_energy_cost = metadata['GENERATION_METER']['pce_energy_cost']

        # Should have peak, off_peak, total
        assert 'peak' in pce_energy_cost
        assert 'off_peak' in pce_energy_cost
        assert 'total' in pce_energy_cost

        # Each should have unit and where_found
        for tou_key in ['peak', 'off_peak', 'total']:
            assert 'unit' in pce_energy_cost[tou_key]
            assert 'where_found' in pce_energy_cost[tou_key]

        # Peak and off_peak should have $ unit
        assert pce_energy_cost['peak']['unit'] == '$'
        assert pce_energy_cost['off_peak']['unit'] == '$'

    def test_where_found_structure(self):
        """Verify where_found has correct structure."""
        metadata = metadata_loader.load_metadata()
        billing_date = metadata['GENERATION_METER']['billing_date']

        where_found = billing_date['where_found']
        assert len(where_found) > 0

        # First source should have expected fields
        source = where_found[0]
        assert 'where_from' in source
        assert 'where_on_pdf' in source
        assert 'kevins_number_code' in source

        # where_from should be valid enum value
        assert source['where_from'] in [
            'PDF_BILL', 'PDF_DETAIL_OF_BILL',
            'CALCULATED', 'FIXED_VALUE', 'NOT_PROVIDED'
        ]

    def test_clear_cache(self):
        """Verify clear_cache works."""
        # Load metadata
        metadata1 = metadata_loader.load_metadata()

        # Clear cache
        metadata_loader.clear_cache()

        # Load again - should be different object
        metadata2 = metadata_loader.load_metadata()

        # Should not be the same object (was reloaded)
        # Note: content is same, but object ID different
        assert metadata1 is not metadata2

    def test_metadata_field_count(self):
        """Verify both meter types have same number of fields."""
        metadata = metadata_loader.load_metadata()

        gen_count = len(metadata['GENERATION_METER'])
        ben_count = len(metadata['BENEFIT_METER'])

        # Both should have 22 fields (as per proto)
        assert gen_count == ben_count
        assert gen_count == 22

    def test_no_field_name_keys_in_metadata(self):
        """Verify field_name keys were removed in transformation."""
        metadata = metadata_loader.load_metadata()

        for meter_type in ['GENERATION_METER', 'BENEFIT_METER']:
            for field_name, field_data in metadata[meter_type].items():
                # Should NOT have field_name as a key
                assert 'field_name' not in field_data

                # Check TOU nested fields too
                for tou_key in ['peak', 'off_peak', 'total']:
                    if tou_key in field_data:
                        assert 'field_name' not in field_data[tou_key]

    def test_no_field_type_keys_in_metadata(self):
        """Verify field_type keys were removed in transformation."""
        metadata = metadata_loader.load_metadata()

        for meter_type in ['GENERATION_METER', 'BENEFIT_METER']:
            for field_name, field_data in metadata[meter_type].items():
                # Should NOT have field_type as a key
                assert 'field_type' not in field_data

                # Check TOU nested fields too
                for tou_key in ['peak', 'off_peak', 'total']:
                    if tou_key in field_data:
                        assert 'field_type' not in field_data[tou_key]
