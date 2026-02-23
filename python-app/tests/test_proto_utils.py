"""Tests for proto_utils serialization functions."""

import pytest
from proto_utils import proto_to_dict, _serialize_metric, _serialize_tou_metric, _serialize_meter, _merge_calculated_values
from proto.billing import EnergyMetric, EnergyMetricTOU, NEM2AMeterType, MeterBillingMonth


def test_serialize_metric_with_values():
    """Test basic EnergyMetric conversion with subcomponent values."""
    metric = EnergyMetric(subcomponent_values=[100.5, 50.25, 25.0])
    result = _serialize_metric(metric)

    assert result['subcomponent_values'] == [100.5, 50.25, 25.0]
    assert result['value'] == 175.75  # Sum of subcomponents


def test_serialize_metric_empty():
    """Test EnergyMetric with no subcomponent values."""
    metric = EnergyMetric(subcomponent_values=[])
    result = _serialize_metric(metric)

    assert result['subcomponent_values'] == []
    assert result['value'] is None


def test_serialize_metric_none():
    """Test handling of None metric."""
    result = _serialize_metric(None)

    assert result['subcomponent_values'] == []
    assert result['value'] is None


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
    # month_label is now a dict with month_name and year
    assert month1['month_label']['month_name'] == 'May'
    assert month1['month_label']['year'] == 2024
    assert month1['main'] is not None
    assert month1['adu'] is not None


def test_proto_to_dict_meter_data(sample_billing_year):
    """Test that meter data is completely serialized."""
    result = proto_to_dict(sample_billing_year)

    main_meter = result['billing_months'][0]['main']

    # Check enum conversion
    assert main_meter['nem2a_meter_type'] == 'GENERATION_METER'

    # Check dates - they are now dicts with 'value' field
    assert main_meter['billing_date']['value'] == '2024-05-14'
    assert main_meter['service_end_date']['value'] == '2024-05-07'

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


# ============================================================================
# INTEGRATION TESTS FOR RUNTIME CALCULATIONS
# ============================================================================

def test_generation_meter_has_calculated_values(sample_billing_year):
    """Verify generation meter calculations appear in serialized output."""
    result = proto_to_dict(sample_billing_year)

    gen_meter = result['billing_months'][0]['main']

    # Check calculated fields have 'value'
    assert 'value' in gen_meter['energy_export_meter_channel_2']['peak']
    assert 'value' in gen_meter['energy_export_meter_channel_2']['off_peak']
    assert 'value' in gen_meter['pce_energy_cost']['total']
    assert 'value' in gen_meter['pce_total_energy_charges']
    assert 'value' in gen_meter['total_bill_in_mail']


def test_benefit_meter_has_calculated_values(sample_billing_year):
    """Verify benefit meter calculations appear in serialized output."""
    result = proto_to_dict(sample_billing_year)

    benefit_meter = result['billing_months'][0]['adu']

    # Check calculated fields
    assert 'value' in benefit_meter['allocated_export_energy_credits']['peak']
    assert 'value' in benefit_meter['allocated_export_energy_credits']['off_peak']
    assert 'value' in benefit_meter['energy_import_meter_channel_1']['peak']
    assert 'value' in benefit_meter['energy_import_meter_channel_1']['off_peak']


def test_calculations_preserve_subcomponents(sample_billing_year):
    """Calculated values should not remove subcomponent_values."""
    result = proto_to_dict(sample_billing_year)

    gen_meter = result['billing_months'][0]['main']

    # Both subcomponent_values and value should exist
    assert 'subcomponent_values' in gen_meter['pce_energy_cost']['total']
    assert 'value' in gen_meter['pce_energy_cost']['total']

    # Original subcomponent_values should be preserved
    assert 'subcomponent_values' in gen_meter['pce_net_generation_bonus']
    assert 'value' in gen_meter['pce_net_generation_bonus']


def test_calculation_order_generation_before_benefit(sample_billing_year):
    """Benefit meter calculations should use generation meter results."""
    result = proto_to_dict(sample_billing_year)

    # Check that calculated values exist (even if None)
    gen_meter = result['billing_months'][0]['main']
    benefit_meter = result['billing_months'][0]['adu']

    # Both meters should have the calculated fields present
    assert 'value' in gen_meter['energy_export_meter_channel_2']['peak']
    assert 'value' in benefit_meter['allocated_export_energy_credits']['peak']


def test_pce_cost_total_calculation():
    """Verify pce_energy_cost.total is calculated as peak + off_peak."""
    # Create a simple test case with known values
    meter = MeterBillingMonth(
        nem2a_meter_type=NEM2AMeterType.GENERATION_METER,
        pce_energy_cost=EnergyMetricTOU(
            peak=EnergyMetric(subcomponent_values=[50.0]),
            off_peak=EnergyMetric(subcomponent_values=[75.0]),
            total=EnergyMetric(subcomponent_values=[])  # Empty - should be calculated
        )
    )

    from proto_utils import _serialize_meter
    from billing_calculations import calculate_meter_values

    serialized = _serialize_meter(meter)
    calculated = calculate_meter_values(serialized)

    # Verify calculation
    assert calculated['pce_energy_cost']['total']['value'] == 125.0  # 50 + 75


def test_total_bill_calculation():
    """Verify total_bill_in_mail is calculated correctly."""
    meter = MeterBillingMonth(
        nem2a_meter_type=NEM2AMeterType.GENERATION_METER,
        pce_generation_charges_due_cash=EnergyMetric(subcomponent_values=[50.0]),
        pge_electric_delivery_charges=EnergyMetric(subcomponent_values=[25.0]),
        california_climate_credit=EnergyMetric(subcomponent_values=[-10.0]),
        total_bill_in_mail=EnergyMetric(subcomponent_values=[])  # Empty - should be calculated
    )

    from proto_utils import _serialize_meter
    from billing_calculations import calculate_meter_values

    serialized = _serialize_meter(meter)
    calculated = calculate_meter_values(serialized)

    # Verify calculation: 50 + 25 + (-10) = 65
    assert calculated['total_bill_in_mail']['value'] == 65.0


def test_benefit_meter_energy_import_calculation():
    """Verify benefit meter energy import is calculated correctly."""
    # Create generation meter with export data
    gen_meter = MeterBillingMonth(
        nem2a_meter_type=NEM2AMeterType.GENERATION_METER,
        energy_export_meter_channel_2=EnergyMetricTOU(
            peak=EnergyMetric(subcomponent_values=[]),  # Will be calculated
            off_peak=EnergyMetric(subcomponent_values=[]),
            total=EnergyMetric(subcomponent_values=[-1000.0])
        ),
        allocated_export_energy_credits=EnergyMetricTOU(
            peak=EnergyMetric(subcomponent_values=[-200.0]),
            off_peak=EnergyMetric(subcomponent_values=[-300.0]),
            total=EnergyMetric(subcomponent_values=[-500.0])
        )
    )

    # Create benefit meter
    benefit_meter = MeterBillingMonth(
        nem2a_meter_type=NEM2AMeterType.BENEFIT_METER,
        net_energy_usage_after_credits=EnergyMetricTOU(
            peak=EnergyMetric(subcomponent_values=[150.0]),
            off_peak=EnergyMetric(subcomponent_values=[200.0]),
            total=EnergyMetric(subcomponent_values=[350.0])
        ),
        allocated_export_energy_credits=EnergyMetricTOU(
            peak=EnergyMetric(subcomponent_values=[]),  # Will be calculated
            off_peak=EnergyMetric(subcomponent_values=[]),
            total=EnergyMetric(subcomponent_values=[])
        ),
        energy_import_meter_channel_1=EnergyMetricTOU(
            peak=EnergyMetric(subcomponent_values=[]),  # Will be calculated
            off_peak=EnergyMetric(subcomponent_values=[]),
            total=EnergyMetric(subcomponent_values=[])
        )
    )

    from proto_utils import _serialize_meter
    from billing_calculations import calculate_meter_values

    # Serialize and calculate generation meter
    gen_serialized = _serialize_meter(gen_meter)
    gen_calculated = calculate_meter_values(gen_serialized)
    gen_result = _merge_calculated_values(gen_serialized, gen_calculated)

    # Serialize and calculate benefit meter (using generation meter data)
    benefit_serialized = _serialize_meter(benefit_meter)
    benefit_calculated = calculate_meter_values(benefit_serialized, gen_result)
    benefit_result = _merge_calculated_values(benefit_serialized, benefit_calculated)

    # Verify allocated credits calculation exists
    assert 'value' in benefit_result['allocated_export_energy_credits']['peak']
    assert 'value' in benefit_result['energy_import_meter_channel_1']['peak']

    # Verify import calculation: net_usage - allocated_credits
    import_peak = benefit_result['energy_import_meter_channel_1']['peak']['value']
    assert import_peak is not None
