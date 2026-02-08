"""Tests for proto_utils serialization functions."""

import pytest
from proto_utils import proto_to_dict, _serialize_metric, _serialize_tou_metric, _serialize_meter
from proto.billing import EnergyMetric, EnergyMetricTOU, NEM2AMeterType


def test_serialize_metric_with_values():
    """Test basic EnergyMetric conversion with subcomponent values."""
    metric = EnergyMetric(subcomponent_values=[100.5, 50.25, 25.0])
    result = _serialize_metric(metric)

    assert result['subcomponent_values'] == [100.5, 50.25, 25.0]
    assert result['value'] == 175.75  # Sum of subcomponents
    assert result['unit'] == 'kWh'


def test_serialize_metric_empty():
    """Test EnergyMetric with no subcomponent values."""
    metric = EnergyMetric(subcomponent_values=[])
    result = _serialize_metric(metric)

    assert result['subcomponent_values'] == []
    assert result['value'] is None
    assert result['unit'] == 'kWh'


def test_serialize_metric_none():
    """Test handling of None metric."""
    result = _serialize_metric(None)

    assert result['subcomponent_values'] == []
    assert result['value'] is None
    assert result['unit'] == 'kWh'


def test_serialize_tou_metric():
    """Test EnergyMetricTOU conversion with peak/off_peak/total."""
    tou = EnergyMetricTOU(
        peak=EnergyMetric(subcomponent_values=[100.0]),
        off_peak=EnergyMetric(subcomponent_values=[200.0, 50.0]),
        total=EnergyMetric(subcomponent_values=[350.0])
    )
    result = _serialize_tou_metric(tou)

    # Check peak
    assert result['peak']['value'] == 100.0
    assert result['peak']['subcomponent_values'] == [100.0]

    # Check off_peak
    assert result['off_peak']['value'] == 250.0
    assert result['off_peak']['subcomponent_values'] == [200.0, 50.0]

    # Check total
    assert result['total']['value'] == 350.0
    assert result['total']['subcomponent_values'] == [350.0]


def test_serialize_tou_metric_none():
    """Test handling of None TOU metric."""
    result = _serialize_tou_metric(None)

    assert result['peak'] is None
    assert result['off_peak'] is None
    assert result['total'] is None


def test_proto_to_dict_structure(sample_billing_year):
    """Test full BillingYear produces complete structure."""
    result = proto_to_dict(sample_billing_year)

    # Check top-level fields
    assert 'start_month' in result
    assert 'start_year' in result
    assert 'num_months' in result
    assert 'months' in result
    assert 'billing_months' in result

    assert result['start_month'] == 5
    assert result['start_year'] == 2024
    assert result['num_months'] == 2


def test_proto_to_dict_months_field(sample_billing_year):
    """Test that months field is present and correctly formatted."""
    result = proto_to_dict(sample_billing_year)

    assert len(result['months']) == 2
    assert result['months'][0]['month_name'] == 'May'
    assert result['months'][0]['year'] == 2024
    assert result['months'][1]['month_name'] == 'June'
    assert result['months'][1]['year'] == 2024


def test_proto_to_dict_billing_months(sample_billing_year):
    """Test that billing_months are serialized with all nested data."""
    result = proto_to_dict(sample_billing_year)

    assert len(result['billing_months']) == 2

    # Check first billing month
    month1 = result['billing_months'][0]
    assert month1['year'] == 2024
    assert month1['month'] == 5
    assert month1['month_label'] == 'May'
    assert month1['main'] is not None
    assert month1['adu'] is not None


def test_proto_to_dict_meter_data(sample_billing_year):
    """Test that meter data is completely serialized."""
    result = proto_to_dict(sample_billing_year)

    main_meter = result['billing_months'][0]['main']

    # Check enum conversion
    assert main_meter['nem2a_meter_type'] == 'GENERATION_METER'

    # Check dates
    assert main_meter['billing_date'] == '2024-05-14'
    assert main_meter['service_end_date'] == '2024-05-07'

    # Check TOU metrics exist
    assert 'energy_export_meter_channel_2' in main_meter
    assert 'energy_import_meter_channel_1' in main_meter

    # Check total bill
    assert 'total_bill_in_mail' in main_meter


def test_proto_to_dict_energy_values(sample_billing_year):
    """Test that energy values have both subcomponent_values and calculated value."""
    result = proto_to_dict(sample_billing_year)

    export = result['billing_months'][0]['main']['energy_export_meter_channel_2']

    # Check peak has value field
    assert 'value' in export['peak']
    assert export['peak']['value'] == -113.825
    assert export['peak']['subcomponent_values'] == [-113.825]

    # Check off_peak
    assert 'value' in export['off_peak']
    assert export['off_peak']['value'] == -884.175
    assert export['off_peak']['subcomponent_values'] == [-884.175]

    # Check total
    assert 'value' in export['total']
    assert export['total']['value'] == -998.0


def test_proto_to_dict_adu_meter(sample_billing_year):
    """Test that ADU meter is serialized correctly."""
    result = proto_to_dict(sample_billing_year)

    adu_meter = result['billing_months'][0]['adu']

    assert adu_meter['nem2a_meter_type'] == 'BENEFIT_METER'
    assert adu_meter['total_bill_in_mail']['value'] == 15.50


def test_meter_enum_conversion():
    """Test enum conversion to string names."""
    from proto.billing import MeterBillingMonth

    meter = MeterBillingMonth(
        nem2a_meter_type=NEM2AMeterType.GENERATION_METER
    )
    result = _serialize_meter(meter)

    assert result['nem2a_meter_type'] == 'GENERATION_METER'

    meter2 = MeterBillingMonth(
        nem2a_meter_type=NEM2AMeterType.BENEFIT_METER
    )
    result2 = _serialize_meter(meter2)

    assert result2['nem2a_meter_type'] == 'BENEFIT_METER'


def test_proto_to_dict_empty():
    """Test handling of None BillingYear."""
    result = proto_to_dict(None)
    assert result == {}


def test_multiple_subcomponent_values():
    """Test metric with multiple subcomponent values (rate changes mid-month)."""
    # Simulate a month where rates changed mid-month
    metric = EnergyMetric(subcomponent_values=[150.5, 125.3, 200.7])
    result = _serialize_metric(metric)

    assert len(result['subcomponent_values']) == 3
    assert result['value'] == pytest.approx(476.5, rel=1e-5)


def test_negative_energy_values():
    """Test handling of negative values (export)."""
    metric = EnergyMetric(subcomponent_values=[-500.0, -250.0])
    result = _serialize_metric(metric)

    assert result['value'] == -750.0
    assert result['subcomponent_values'] == [-500.0, -250.0]
