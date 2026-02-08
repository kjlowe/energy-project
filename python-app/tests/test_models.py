"""Tests for models.py database operations."""

import pytest
from models import DatabaseManager, BillingDB
from proto.billing import BillingYear


def test_database_manager_creation(tmp_path):
    """Test DatabaseManager creates database and tables."""
    db_path = tmp_path / "test.db"
    manager = DatabaseManager(db_path=str(db_path))

    assert db_path.exists()
    assert manager.engine is not None
    assert manager.Session is not None


def test_add_billing_year(db_manager, sample_billing_year):
    """Test adding a billing year to database."""
    result = db_manager.add_billing_year(sample_billing_year)

    assert result is not None
    assert 'id' in result
    assert result['start_month'] == 5
    assert result['start_year'] == 2024
    assert result['num_months'] == 2


def test_get_all_billing_years(populated_db):
    """Test retrieving all billing years."""
    results = populated_db.get_all_billing_years()

    assert len(results) == 1
    assert results[0]['start_month'] == 5
    assert results[0]['start_year'] == 2024


def test_get_billing_year_by_id(populated_db):
    """Test retrieving specific billing year by ID."""
    # First get all to find the ID
    all_years = populated_db.get_all_billing_years()
    year_id = all_years[0]['id']

    # Now get by ID
    result = populated_db.get_billing_year_by_id(year_id)

    assert result is not None
    assert result['id'] == year_id
    assert result['start_month'] == 5


def test_get_billing_year_by_invalid_id(db_manager):
    """Test retrieving non-existent billing year returns None."""
    result = db_manager.get_billing_year_by_id(9999)
    assert result is None


def test_delete_billing_year(populated_db):
    """Test deleting a billing year."""
    # Get the ID
    all_years = populated_db.get_all_billing_years()
    year_id = all_years[0]['id']

    # Delete it
    success = populated_db.delete_billing_year(year_id)
    assert success is True

    # Verify it's gone
    result = populated_db.get_billing_year_by_id(year_id)
    assert result is None


def test_delete_nonexistent_billing_year(db_manager):
    """Test deleting non-existent billing year returns False."""
    success = db_manager.delete_billing_year(9999)
    assert success is False


def test_billing_db_to_dict_completeness(populated_db, sample_billing_year):
    """Test that to_dict() includes all expected fields."""
    all_years = populated_db.get_all_billing_years()
    result = all_years[0]

    # Top-level fields
    assert 'id' in result
    assert 'start_month' in result
    assert 'start_year' in result
    assert 'num_months' in result
    assert 'months' in result
    assert 'billing_months' in result

    # No old test fields
    assert 'test' not in result
    assert 'billing_months_count' not in result


def test_billing_db_to_dict_months_field(populated_db):
    """Test that months field exists (for frontend compatibility)."""
    all_years = populated_db.get_all_billing_years()
    result = all_years[0]

    assert 'months' in result
    assert len(result['months']) == 2
    assert result['months'][0]['month_name'] == 'May'
    assert result['months'][1]['month_name'] == 'June'


def test_billing_db_to_dict_nested_data(populated_db):
    """Test that nested billing_months data is complete."""
    all_years = populated_db.get_all_billing_years()
    result = all_years[0]

    assert len(result['billing_months']) == 2

    # Check first month has complete structure
    month1 = result['billing_months'][0]
    assert 'main' in month1
    assert 'adu' in month1

    # Check main meter has all expected fields
    main = month1['main']
    assert 'nem2a_meter_type' in main
    assert 'billing_date' in main
    assert 'energy_export_meter_channel_2' in main
    assert 'energy_import_meter_channel_1' in main
    assert 'total_bill_in_mail' in main


def test_billing_db_to_dict_metric_has_value(populated_db):
    """Test that energy metrics have calculated value field."""
    all_years = populated_db.get_all_billing_years()
    result = all_years[0]

    export = result['billing_months'][0]['main']['energy_export_meter_channel_2']

    # Check value field exists
    assert 'value' in export['peak']
    assert 'value' in export['off_peak']
    assert 'value' in export['total']

    # Check values are correct
    assert export['peak']['value'] == -113.825
    assert export['off_peak']['value'] == -884.175
    assert export['total']['value'] == -998.0


def test_billing_db_round_trip(db_manager, sample_billing_year):
    """Test data integrity through save/load cycle."""
    # Save
    saved = db_manager.add_billing_year(sample_billing_year)
    saved_id = saved['id']

    # Load
    loaded = db_manager.get_billing_year_by_id(saved_id)

    # Verify critical values match
    assert loaded['start_month'] == sample_billing_year.start_month
    assert loaded['start_year'] == sample_billing_year.start_year
    assert loaded['num_months'] == sample_billing_year.num_months

    # Verify nested data integrity
    assert len(loaded['billing_months']) == 2
    assert loaded['billing_months'][0]['main']['total_bill_in_mail']['value'] == 67.83
    assert loaded['billing_months'][1]['main']['total_bill_in_mail']['value'] == 55.25


def test_multiple_billing_years(db_manager, sample_billing_year):
    """Test storing and retrieving multiple billing years."""
    # Add first year
    db_manager.add_billing_year(sample_billing_year)

    # Create and add second year (different year)
    second_year = BillingYear(
        start_month=1,
        start_year=2025,
        num_months=2,
        months=sample_billing_year.months,
        billing_months=sample_billing_year.billing_months
    )
    db_manager.add_billing_year(second_year)

    # Get all
    all_years = db_manager.get_all_billing_years()

    assert len(all_years) == 2
    assert all_years[0]['start_year'] == 2024
    assert all_years[1]['start_year'] == 2025


def test_from_proto_creates_correct_db_model(sample_billing_year):
    """Test BillingDB.from_proto creates correct database model."""
    db_model = BillingDB.from_proto(sample_billing_year)

    assert db_model.start_month == 5
    assert db_model.start_year == 2024
    assert db_model.num_months == 2
    assert db_model.proto_data is not None
    assert isinstance(db_model.proto_data, str)  # Hex string


def test_to_proto_recreates_original(sample_billing_year):
    """Test BillingDB.to_proto recreates original protobuf."""
    # Convert to DB model
    db_model = BillingDB.from_proto(sample_billing_year)

    # Convert back to proto
    proto = db_model.to_proto()

    # Verify fields match
    assert proto.start_month == sample_billing_year.start_month
    assert proto.start_year == sample_billing_year.start_year
    assert proto.num_months == sample_billing_year.num_months
    assert len(proto.billing_months) == len(sample_billing_year.billing_months)
