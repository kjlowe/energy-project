"""
Unit tests for metadata_loader module (Proto-based).
"""

import pytest
import betterproto
import metadata_loader
from proto.metadata import BillingStructureMetadata, Unit, WhereFrom


class TestMetadataLoader:
    """Tests for metadata loading and caching."""

    def setup_method(self):
        """Clear cache before each test."""
        metadata_loader.clear_cache()

    def test_load_metadata_returns_proto(self):
        """Verify metadata loads as BillingStructureMetadata proto."""
        metadata = metadata_loader.load_metadata()
        assert isinstance(metadata, BillingStructureMetadata)

    def test_load_metadata_caching(self):
        """Verify metadata loads once and caches."""
        # First load
        metadata1 = metadata_loader.load_metadata()

        # Second load should return same object (cached)
        metadata2 = metadata_loader.load_metadata()

        # Should be the exact same object in memory
        assert metadata1 is metadata2

    def test_metadata_has_generation_meter(self):
        """Check generation_meter exists."""
        metadata = metadata_loader.load_metadata()
        assert metadata.generation_meter is not None
        assert hasattr(metadata.generation_meter, 'fields')

    def test_metadata_has_benefit_meter(self):
        """Check benefit_meter exists."""
        metadata = metadata_loader.load_metadata()
        assert metadata.benefit_meter is not None
        assert hasattr(metadata.benefit_meter, 'fields')

    def test_metadata_structure_is_map(self):
        """Verify new format uses map for fields."""
        metadata = metadata_loader.load_metadata()

        # Should be map with field names as keys
        assert isinstance(metadata.generation_meter.fields, dict)
        assert isinstance(metadata.benefit_meter.fields, dict)

        # Should have fields
        assert len(metadata.generation_meter.fields) > 0
        assert len(metadata.benefit_meter.fields) > 0

    def test_generation_meter_has_fields(self):
        """Verify generation_meter has expected fields."""
        metadata = metadata_loader.load_metadata()
        gen_meter = metadata.generation_meter

        # Check some known fields exist
        assert 'billing_date' in gen_meter.fields
        assert 'pce_energy_cost' in gen_meter.fields
        assert 'total_bill_in_mail' in gen_meter.fields

    def test_benefit_meter_has_fields(self):
        """Verify benefit_meter has expected fields."""
        metadata = metadata_loader.load_metadata()
        ben_meter = metadata.benefit_meter

        # Check some known fields exist
        assert 'billing_date' in ben_meter.fields
        assert 'pce_energy_cost' in ben_meter.fields
        assert 'total_bill_in_mail' in ben_meter.fields

    def test_date_field_structure(self):
        """Verify date fields have where_found but no unit."""
        metadata = metadata_loader.load_metadata()
        billing_date_field = metadata.generation_meter.fields['billing_date']

        # Get the actual date field using which_one_of
        field_type, date_field = betterproto.which_one_of(billing_date_field, 'metadata')
        assert field_type == 'date_field'

        # Should have where_found
        assert hasattr(date_field, 'where_found')
        assert isinstance(date_field.where_found, list)
        assert len(date_field.where_found) > 0

        # Should NOT have unit (it's a date)
        assert not hasattr(date_field, 'unit')

    def test_simple_metric_field_structure(self):
        """Verify simple metric fields have unit and where_found."""
        metadata = metadata_loader.load_metadata()
        climate_credit_field = metadata.generation_meter.fields['california_climate_credit']

        # Get the actual simple field using which_one_of
        field_type, simple_field = betterproto.which_one_of(climate_credit_field, 'metadata')
        assert field_type == 'simple_field'

        # Should have unit
        assert hasattr(simple_field, 'unit')
        assert simple_field.unit == Unit.DOLLARS

        # Should have where_found
        assert hasattr(simple_field, 'where_found')
        assert isinstance(simple_field.where_found, list)

    def test_tou_metric_field_structure(self):
        """Verify TOU metric fields have peak/off_peak/total structure."""
        metadata = metadata_loader.load_metadata()
        pce_energy_cost_field = metadata.generation_meter.fields['pce_energy_cost']

        # Get the actual TOU field using which_one_of
        field_type, tou_field = betterproto.which_one_of(pce_energy_cost_field, 'metadata')
        assert field_type == 'tou_field'

        # Should have peak, off_peak, total
        assert hasattr(tou_field, 'peak')
        assert hasattr(tou_field, 'off_peak')
        assert hasattr(tou_field, 'total')

        # Each should have unit and where_found
        for component in [tou_field.peak, tou_field.off_peak, tou_field.total]:
            assert hasattr(component, 'unit')
            assert hasattr(component, 'where_found')

        # Peak and off_peak should have DOLLARS unit
        assert tou_field.peak.unit == Unit.DOLLARS
        assert tou_field.off_peak.unit == Unit.DOLLARS

    def test_where_found_structure(self):
        """Verify where_found has correct structure."""
        metadata = metadata_loader.load_metadata()
        billing_date_field = metadata.generation_meter.fields['billing_date']

        # Get the actual date field
        field_type, date_field = betterproto.which_one_of(billing_date_field, 'metadata')
        where_found = date_field.where_found
        assert len(where_found) > 0

        # First source should have expected fields
        source = where_found[0]
        assert hasattr(source, 'where_from')
        assert hasattr(source, 'where_on_pdf')
        assert hasattr(source, 'kevins_number_code')

        # where_from should be valid enum value
        assert source.where_from in [
            WhereFrom.PDF_BILL,
            WhereFrom.PDF_DETAIL_OF_BILL,
            WhereFrom.CALCULATED,
            WhereFrom.FIXED_VALUE,
            WhereFrom.NOT_PROVIDED
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

        gen_count = len(metadata.generation_meter.fields)
        ben_count = len(metadata.benefit_meter.fields)

        # Both should have 22 fields (as per proto)
        assert gen_count == ben_count
        assert gen_count == 22

    def test_field_validation_against_billing_proto(self):
        """Verify fields are validated against billing.proto."""
        # This is tested implicitly by load_metadata() not raising an error
        # The loader validates that JSON fields match MeterBillingMonth fields
        metadata = metadata_loader.load_metadata()

        # Should have successfully loaded
        assert metadata is not None
        assert len(metadata.generation_meter.fields) == 22
        assert len(metadata.benefit_meter.fields) == 22

    def test_energy_fields_have_kwh_unit(self):
        """Verify energy fields have KILOWATT_HOURS unit."""
        metadata = metadata_loader.load_metadata()

        energy_field = metadata.generation_meter.fields['energy_export_meter_channel_2']
        field_type, tou_field = betterproto.which_one_of(energy_field, 'metadata')

        assert field_type == 'tou_field'
        assert tou_field.peak.unit == Unit.KILOWATT_HOURS
        assert tou_field.off_peak.unit == Unit.KILOWATT_HOURS
        assert tou_field.total.unit == Unit.KILOWATT_HOURS
