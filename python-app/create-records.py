"""
Load BillingYear data from JSON and populate the database
Run: python create-records.py
"""

from config import *
from proto.billing import *
from models import DatabaseManager
import json
import os
from datetime import datetime

# Month names
MONTHS = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"]

def load_billing_year_from_json(json_path):
    """Load BillingYear data from JSON and convert to protobuf."""
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Create month labels
    month_labels = []
    for i in range(data['num_months']):
        month_idx = (data['start_month'] - 1 + i) % 12
        year_offset = (data['start_month'] - 1 + i) // 12
        
        month_labels.append(MonthLabel(
            month_name=MONTHS[month_idx],
            year=data['start_year'] + year_offset
        ))
    
    # Process billing months
    billing_months = []
    for month_data in data['billing_months']:
        billing_month = NEM2AAggregationBillingMonth(
            year=month_data['year'],
            month=month_data['month'],
            month_label=MonthLabel(
                month_name=month_data['month_label']['month_name'],
                year=month_data['month_label']['year']
            ),
            main=create_meter(month_data['main']),
            adu=create_meter(month_data['adu'])
        )
        billing_months.append(billing_month)
    
    # Create BillingYear
    billing_year = BillingYear(
        start_month=data['start_month'],
        start_year=data['start_year'],
        num_months=data['num_months'],
        months=month_labels,
        billing_months=billing_months
    )
    
    return billing_year

def create_meter(meter_data):
    """Create a MeterBillingMonth protobuf from JSON data."""
    
    # Set meter type
    meter_type = NEM2AMeterType.GENERATION_METER if meter_data['nem2a_meter_type'] == 'GenerationMeter' else NEM2AMeterType.BENEFIT_METER
    
    return MeterBillingMonth(
        nem2a_meter_type=meter_type,
        billing_date=EnergyDate(value=meter_data['billing_date']['value'] or ''),
        service_end_date=EnergyDate(value=meter_data['service_end_date']['value'] or ''),
        energy_export_meter_channel_2=create_tou_metric(meter_data['energy_export_meter_channel_2']),
        energy_import_meter_channel_1=create_tou_metric(meter_data['energy_import_meter_channel_1']),
        allocated_export_energy_credits=create_tou_metric(meter_data['allocated_export_energy_credits']),
        net_energy_usage_after_credits=create_tou_metric(meter_data['net_energy_usage_after_credits']),
        pce_energy_cost=create_tou_metric(meter_data['pce_energy_cost']),
        pce_net_generation_bonus=create_metric(meter_data['pce_net_generation_bonus']),
        pce_energy_commission_surcharge=create_metric(meter_data['pce_energy_commission_surcharge']),
        pce_total_energy_charges=create_metric(meter_data['pce_total_energy_charges']),
        pce_nem_credit=create_metric(meter_data['pce_nem_credit']),
        pce_generation_charges_due_cash=create_metric(meter_data['pce_generation_charges_due_cash']),
        pge_res_energy_charges=create_metric(meter_data['pge_res_energy_charges']),
        pge_baseline_credit=create_metric(meter_data['pge_baseline_credit']),
        pge_da_cca_charges=create_metric(meter_data['pge_da_cca_charges']),
        pge_total_energy_charges=create_metric(meter_data['pge_total_energy_charges']),
        pge_nem_billing=create_metric(meter_data['pge_nem_billing']),
        pge_minimum_delivery_charge=create_metric(meter_data['pge_minimum_delivery_charge']),
        pge_nem_true_up_adjustment=create_metric(meter_data['pge_nem_true_up_adjustment']),
        pge_electric_delivery_charges=create_metric(meter_data['pge_electric_delivery_charges']),
        california_climate_credit=create_metric(meter_data['california_climate_credit']),
        total_bill_in_mail=create_metric(meter_data['total_bill_in_mail'])
    )

def create_tou_metric(tou_data):
    """Create an EnergyMetricTOU from JSON data."""
    return EnergyMetricTOU(
        peak=create_metric(tou_data['peak']),
        off_peak=create_metric(tou_data['off_peak']),
        total=create_metric(tou_data['total'])
    )

def create_metric(metric_data):
    """Create an EnergyMetric from JSON data."""
    return EnergyMetric(
        subcomponent_values=metric_data['subcomponent_values'] if metric_data['subcomponent_values'] else []
    )

# Initialize database manager
print("🗑️  Deleting existing database...\n")
db_path = BILLING_DB
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"   Deleted: {db_path}")

print("\n📊 Initializing new database...\n")
db = DatabaseManager()

# Load billing year from JSON
json_path = os.path.join(os.path.dirname(__file__), 'data', 'billing_year_2024_complete.json')
print(f"📖 Loading billing year from: {json_path}\n")

billing_year = load_billing_year_from_json(json_path)

print(f"Loaded BillingYear:")
print(f"  Start: {MONTHS[billing_year.start_month-1]} {billing_year.start_year}")
print(f"  Duration: {billing_year.num_months} months")
print(f"  Billing months: {len(billing_year.billing_months)}")

# Add to database
result = db.add_billing_year(billing_year)
print(f"\n💾 Saved to database with ID: {result['id']}\n")

print("=" * 60)
print("\n📖 Reading from database...\n")

# Get all billing years using DatabaseManager
all_billing_years = db.get_all_billing_years()

for by in all_billing_years:
    print(f"ID: {by['id']}")
    print(f"  Start: {MONTHS[by['start_month']-1]} {by['start_year']}")
    print(f"  Months: {by['num_months']}")
    print(f"  Month Labels: {len(by['months'])}")
    print(f"  Billing Months: {by['billing_months_count']}")
    print()

print("=" * 60)
print(f"✅ Success! Stored and retrieved {len(all_billing_years)} billing years")