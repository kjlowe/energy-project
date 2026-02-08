"""Pytest fixtures for testing."""

import pytest
import os
from pathlib import Path
from models import DatabaseManager, BillingDB
from proto.billing import (
    BillingYear,
    NEM2AAggregationBillingMonth,
    MeterBillingMonth,
    MonthLabel,
    EnergyDate,
    EnergyMetric,
    EnergyMetricTOU,
    NEM2AMeterType
)


@pytest.fixture
def sample_billing_year():
    """Create a sample BillingYear for testing with 2 months of data."""

    # Create month labels
    months = [
        MonthLabel(month_name="May", year=2024),
        MonthLabel(month_name="June", year=2024)
    ]

    # Create billing months
    billing_months = [
        NEM2AAggregationBillingMonth(
            year=2024,
            month=5,
            month_label=MonthLabel(month_name="May", year=2024),
            main=MeterBillingMonth(
                nem2a_meter_type=NEM2AMeterType.GENERATION_METER,
                billing_date=EnergyDate(value="2024-05-14"),
                service_end_date=EnergyDate(value="2024-05-07"),
                energy_export_meter_channel_2=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[-113.825]),
                    off_peak=EnergyMetric(subcomponent_values=[-884.175]),
                    total=EnergyMetric(subcomponent_values=[-998.0])
                ),
                energy_import_meter_channel_1=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[88.0]),
                    off_peak=EnergyMetric(subcomponent_values=[294.0]),
                    total=EnergyMetric(subcomponent_values=[382.0])
                ),
                total_bill_in_mail=EnergyMetric(subcomponent_values=[67.83])
            ),
            adu=MeterBillingMonth(
                nem2a_meter_type=NEM2AMeterType.BENEFIT_METER,
                billing_date=EnergyDate(value="2024-05-14"),
                service_end_date=EnergyDate(value="2024-05-07"),
                energy_export_meter_channel_2=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[0.0]),
                    off_peak=EnergyMetric(subcomponent_values=[0.0]),
                    total=EnergyMetric(subcomponent_values=[0.0])
                ),
                energy_import_meter_channel_1=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[25.0]),
                    off_peak=EnergyMetric(subcomponent_values=[100.0]),
                    total=EnergyMetric(subcomponent_values=[125.0])
                ),
                total_bill_in_mail=EnergyMetric(subcomponent_values=[15.50])
            )
        ),
        NEM2AAggregationBillingMonth(
            year=2024,
            month=6,
            month_label=MonthLabel(month_name="June", year=2024),
            main=MeterBillingMonth(
                nem2a_meter_type=NEM2AMeterType.GENERATION_METER,
                billing_date=EnergyDate(value="2024-06-14"),
                service_end_date=EnergyDate(value="2024-06-07"),
                energy_export_meter_channel_2=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[-150.0]),
                    off_peak=EnergyMetric(subcomponent_values=[-900.0]),
                    total=EnergyMetric(subcomponent_values=[-1050.0])
                ),
                energy_import_meter_channel_1=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[75.0]),
                    off_peak=EnergyMetric(subcomponent_values=[250.0]),
                    total=EnergyMetric(subcomponent_values=[325.0])
                ),
                total_bill_in_mail=EnergyMetric(subcomponent_values=[55.25])
            ),
            adu=MeterBillingMonth(
                nem2a_meter_type=NEM2AMeterType.BENEFIT_METER,
                billing_date=EnergyDate(value="2024-06-14"),
                service_end_date=EnergyDate(value="2024-06-07"),
                energy_export_meter_channel_2=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[0.0]),
                    off_peak=EnergyMetric(subcomponent_values=[0.0]),
                    total=EnergyMetric(subcomponent_values=[0.0])
                ),
                energy_import_meter_channel_1=EnergyMetricTOU(
                    peak=EnergyMetric(subcomponent_values=[30.0]),
                    off_peak=EnergyMetric(subcomponent_values=[110.0]),
                    total=EnergyMetric(subcomponent_values=[140.0])
                ),
                total_bill_in_mail=EnergyMetric(subcomponent_values=[18.75])
            )
        )
    ]

    # Create BillingYear
    billing_year = BillingYear(
        start_month=5,
        start_year=2024,
        num_months=2,
        months=months,
        billing_months=billing_months
    )

    return billing_year


@pytest.fixture
def db_manager(tmp_path):
    """Create temporary test database."""
    db_path = tmp_path / "test.db"
    manager = DatabaseManager(db_path=str(db_path))
    return manager


@pytest.fixture
def populated_db(db_manager, sample_billing_year):
    """Database with sample data already loaded."""
    db_manager.add_billing_year(sample_billing_year)
    return db_manager
