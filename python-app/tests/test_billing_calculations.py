"""Unit tests for billing_calculations module."""

import pytest
from billing_calculations import (
    calculate_main_allocation_credits_percentage,
    calculate_benefit_allocation_credits_percentage,
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


class TestHelperCalculations:
    """Tests for helper functions."""

    def test_main_allocation_credits_percentage_normal(self):
        """500 / 1000 = 0.5"""
        result = calculate_main_allocation_credits_percentage(500.0, 1000.0)
        assert result == 0.5

    def test_main_allocation_credits_percentage_full_allocation(self):
        """1000 / 1000 = 1.0"""
        result = calculate_main_allocation_credits_percentage(1000.0, 1000.0)
        assert result == 1.0

    def test_main_allocation_credits_percentage_zero_denominator(self):
        """Division by zero returns None"""
        result = calculate_main_allocation_credits_percentage(500.0, 0.0)
        assert result is None

    def test_main_allocation_credits_percentage_none_allocated(self):
        """None allocated returns None"""
        result = calculate_main_allocation_credits_percentage(None, 1000.0)
        assert result is None

    def test_main_allocation_credits_percentage_none_export(self):
        """None export returns None"""
        result = calculate_main_allocation_credits_percentage(500.0, None)
        assert result is None

    def test_main_allocation_credits_percentage_both_none(self):
        """Both None returns None"""
        result = calculate_main_allocation_credits_percentage(None, None)
        assert result is None


class TestAllocationPercentageCalculations:
    """Tests for allocation percentage calculations."""

    def test_benefit_allocation_normal(self):
        """Benefit allocation: 1.0 - 0.6 = 0.4"""
        result = calculate_benefit_allocation_credits_percentage(0.6)
        assert result == 0.4

    def test_benefit_allocation_full_main(self):
        """Benefit allocation when main has 100%: 1.0 - 1.0 = 0.0"""
        result = calculate_benefit_allocation_credits_percentage(1.0)
        assert result == 0.0

    def test_benefit_allocation_zero_main(self):
        """Benefit allocation when main has 0%: 1.0 - 0.0 = 1.0"""
        result = calculate_benefit_allocation_credits_percentage(0.0)
        assert result == 1.0

    def test_benefit_allocation_none_input(self):
        """None input returns None"""
        result = calculate_benefit_allocation_credits_percentage(None)
        assert result is None

    def test_allocation_credits_percentages_sum_to_one(self):
        """Main and benefit percentages should sum to 1.0"""
        main = calculate_main_allocation_credits_percentage(500.0, 1000.0)
        benefit = calculate_benefit_allocation_credits_percentage(main)

        assert main is not None
        assert benefit is not None
        assert abs((main + benefit) - 1.0) < 0.0001


class TestGenerationMeterCalculations:
    """Tests for generation meter calculation functions."""

    def test_export_peak_normal_case(self):
        """Test normal calculation: 100 / 0.5 = 200"""
        result = calculate_generation_energy_export_peak(100.0, 0.5)
        assert result == 200.0

    def test_export_peak_negative_export(self):
        """Exports are negative: -100 / 0.5 = -200"""
        result = calculate_generation_energy_export_peak(-100.0, 0.5)
        assert result == -200.0

    def test_export_peak_division_by_zero(self):
        """Division by zero should return None"""
        result = calculate_generation_energy_export_peak(100.0, 0.0)
        assert result is None

    def test_export_peak_none_credits(self):
        """None credits should return None"""
        result = calculate_generation_energy_export_peak(None, 0.5)
        assert result is None

    def test_export_peak_none_percentage(self):
        """None percentage should return None"""
        result = calculate_generation_energy_export_peak(100.0, None)
        assert result is None

    def test_export_off_peak_normal_case(self):
        """Test normal calculation: 200 / 0.5 = 400"""
        result = calculate_generation_energy_export_off_peak(200.0, 0.5)
        assert result == 400.0

    def test_export_off_peak_negative_export(self):
        """Negative exports: -200 / 0.5 = -400"""
        result = calculate_generation_energy_export_off_peak(-200.0, 0.5)
        assert result == -400.0

    def test_export_off_peak_division_by_zero(self):
        """Division by zero returns None"""
        result = calculate_generation_energy_export_off_peak(200.0, 0.0)
        assert result is None

    def test_export_off_peak_none_inputs(self):
        """None inputs return None"""
        assert calculate_generation_energy_export_off_peak(None, 0.5) is None
        assert calculate_generation_energy_export_off_peak(200.0, None) is None

    def test_pce_energy_cost_total_both_values(self):
        """Sum: 50.0 + 75.0 = 125.0"""
        result = calculate_pce_energy_cost_total(50.0, 75.0)
        assert result == 125.0

    def test_pce_energy_cost_total_peak_only(self):
        """Treat None as 0: 50.0 + None = 50.0"""
        result = calculate_pce_energy_cost_total(50.0, None)
        assert result == 50.0

    def test_pce_energy_cost_total_off_peak_only(self):
        """Treat None as 0: None + 75.0 = 75.0"""
        result = calculate_pce_energy_cost_total(None, 75.0)
        assert result == 75.0

    def test_pce_energy_cost_total_both_none(self):
        """Both None should return None"""
        result = calculate_pce_energy_cost_total(None, None)
        assert result is None

    def test_pce_energy_cost_total_negative_values(self):
        """Negative costs (credits): -10.0 + -5.0 = -15.0"""
        result = calculate_pce_energy_cost_total(-10.0, -5.0)
        assert result == -15.0

    def test_pce_energy_cost_total_mixed_signs(self):
        """Mixed signs: 100.0 + (-25.0) = 75.0"""
        result = calculate_pce_energy_cost_total(100.0, -25.0)
        assert result == 75.0

    def test_pce_total_energy_charges_all_values(self):
        """Sum all three: 100.0 + 10.0 + 5.0 = 115.0"""
        result = calculate_pce_total_energy_charges(100.0, 10.0, 5.0)
        assert result == 115.0

    def test_pce_total_energy_charges_cost_only(self):
        """Only cost: 100.0 + None + None = 100.0"""
        result = calculate_pce_total_energy_charges(100.0, None, None)
        assert result == 100.0

    def test_pce_total_energy_charges_all_none(self):
        """All None returns None"""
        result = calculate_pce_total_energy_charges(None, None, None)
        assert result is None

    def test_pce_total_energy_charges_negative_bonus(self):
        """Negative bonus (credit): 100.0 + (-15.0) + 5.0 = 90.0"""
        result = calculate_pce_total_energy_charges(100.0, -15.0, 5.0)
        assert result == 90.0

    def test_total_bill_all_values(self):
        """Sum all three: 50.0 + 25.0 + (-10.0) = 65.0"""
        result = calculate_total_bill_in_mail(50.0, 25.0, -10.0)
        assert result == 65.0

    def test_total_bill_generation_only(self):
        """Only generation charges: 50.0 + None + None = 50.0"""
        result = calculate_total_bill_in_mail(50.0, None, None)
        assert result == 50.0

    def test_total_bill_all_none(self):
        """All None returns None"""
        result = calculate_total_bill_in_mail(None, None, None)
        assert result is None

    def test_total_bill_with_credit(self):
        """Climate credit reduces bill: 60.0 + 30.0 + (-5.0) = 85.0"""
        result = calculate_total_bill_in_mail(60.0, 30.0, -5.0)
        assert result == 85.0


class TestBenefitMeterCalculations:
    """Tests for benefit meter calculation functions."""

    def test_allocated_export_peak_normal(self):
        """Leftover: -500.0 - (-300.0) = -200.0"""
        result = calculate_benefit_allocated_export_peak(-500.0, -300.0)
        assert result == -200.0

    def test_allocated_export_peak_zero_leftover(self):
        """All allocated to main: -500.0 - (-500.0) = 0.0"""
        result = calculate_benefit_allocated_export_peak(-500.0, -500.0)
        assert result == 0.0

    def test_allocated_export_peak_none_export(self):
        """None export treated as 0: None - (-300.0) = 300.0"""
        result = calculate_benefit_allocated_export_peak(None, -300.0)
        assert result == 300.0

    def test_allocated_export_peak_none_allocated(self):
        """None allocated treated as 0: -500.0 - None = -500.0"""
        result = calculate_benefit_allocated_export_peak(-500.0, None)
        assert result == -500.0

    def test_allocated_export_peak_both_none(self):
        """Both None returns None"""
        result = calculate_benefit_allocated_export_peak(None, None)
        assert result is None

    def test_allocated_export_off_peak_normal(self):
        """Leftover: -800.0 - (-600.0) = -200.0"""
        result = calculate_benefit_allocated_export_off_peak(-800.0, -600.0)
        assert result == -200.0

    def test_allocated_export_off_peak_none_inputs(self):
        """None handling"""
        assert calculate_benefit_allocated_export_off_peak(None, -600.0) == 600.0
        assert calculate_benefit_allocated_export_off_peak(-800.0, None) == -800.0
        assert calculate_benefit_allocated_export_off_peak(None, None) is None

    def test_energy_import_peak_normal(self):
        """Import: 150.0 - 100.0 = 50.0"""
        result = calculate_benefit_energy_import_peak(150.0, 100.0)
        assert result == 50.0

    def test_energy_import_peak_with_credits(self):
        """More credits than usage: 100.0 - 150.0 = -50.0"""
        result = calculate_benefit_energy_import_peak(100.0, 150.0)
        assert result == -50.0

    def test_energy_import_peak_none_usage(self):
        """None usage treated as 0: None - 100.0 = -100.0"""
        result = calculate_benefit_energy_import_peak(None, 100.0)
        assert result == -100.0

    def test_energy_import_peak_none_credits(self):
        """None credits treated as 0: 150.0 - None = 150.0"""
        result = calculate_benefit_energy_import_peak(150.0, None)
        assert result == 150.0

    def test_energy_import_peak_both_none(self):
        """Both None returns None"""
        result = calculate_benefit_energy_import_peak(None, None)
        assert result is None

    def test_energy_import_off_peak_normal(self):
        """Import: 200.0 - 125.0 = 75.0"""
        result = calculate_benefit_energy_import_off_peak(200.0, 125.0)
        assert result == 75.0

    def test_energy_import_off_peak_none_inputs(self):
        """None handling"""
        assert calculate_benefit_energy_import_off_peak(None, 125.0) == -125.0
        assert calculate_benefit_energy_import_off_peak(200.0, None) == 200.0
        assert calculate_benefit_energy_import_off_peak(None, None) is None


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_all_zero_values(self):
        """Zero inputs should work correctly"""
        assert calculate_pce_energy_cost_total(0.0, 0.0) == 0.0
        assert calculate_pce_total_energy_charges(0.0, 0.0, 0.0) == 0.0
        assert calculate_total_bill_in_mail(0.0, 0.0, 0.0) == 0.0

    def test_very_small_percentage(self):
        """Very small allocation percentage"""
        result = calculate_generation_energy_export_peak(-10.0, 0.01)
        assert result == -1000.0

    def test_very_large_numbers(self):
        """Large numbers don't overflow"""
        result = calculate_pce_energy_cost_total(1000000.0, 2000000.0)
        assert result == 3000000.0

    def test_floating_point_precision(self):
        """Floating point precision"""
        result = calculate_pce_energy_cost_total(0.1, 0.2)
        assert abs(result - 0.3) < 0.0001  # Allow small floating point error

    def test_negative_allocation_credits_percentage(self):
        """Negative allocation percentage (unusual but possible)"""
        result = calculate_main_allocation_credits_percentage(-500.0, -1000.0)
        assert result == 0.5  # -500/-1000 = 0.5
