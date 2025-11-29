"""
Load BillingYear data from JSON and populate the database
Run: python create-records.py
"""

from config import *
from proto import billing_pb2
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
    
    billing_year = billing_pb2.BillingYear()
    
    # Set basic fields
    billing_year.start_month = data['start_month']
    billing_year.start_year = data['start_year']
    billing_year.num_months = data['num_months']
    
    # Add month labels
    for i in range(billing_year.num_months):
        month_idx = (billing_year.start_month - 1 + i) % 12
        year_offset = (billing_year.start_month - 1 + i) // 12
        
        month_label = billing_year.months.add()
        month_label.month_name = MONTHS[month_idx]
        month_label.year = billing_year.start_year + year_offset
    
    # Process billing months
    for month_data in data['billing_months']:
        billing_month = billing_year.billing_months.add()
        billing_month.year = month_data['year']
        billing_month.month = month_data['month']
        billing_month.month_label.month_name = month_data['month_label']['month_name']
        billing_month.month_label.year = month_data['month_label']['year']
        
        # Process main meter
        populate_meter(billing_month.main, month_data['main'])
        
        # Process ADU meter
        populate_meter(billing_month.adu, month_data['adu'])
    
    return billing_year

def populate_meter(meter, meter_data):
    """Populate a MeterBillingMonth protobuf from JSON data."""
    
    # Set meter type
    if meter_data['nem2a_meter_type'] == 'GenerationMeter':
        meter.nem2a_meter_type = billing_pb2.GENERATION_METER
    else:
        meter.nem2a_meter_type = billing_pb2.BENEFIT_METER
    
    # Set dates
    if meter_data['billing_date']['value']:
        meter.billing_date.value = meter_data['billing_date']['value']
    if meter_data['service_end_date']['value']:
        meter.service_end_date.value = meter_data['service_end_date']['value']
    
    # Populate TOU metrics
    populate_tou_metric(meter.energy_export_meter_channel_2, meter_data['energy_export_meter_channel_2'])
    populate_tou_metric(meter.energy_import_meter_channel_1, meter_data['energy_import_meter_channel_1'])
    populate_tou_metric(meter.allocated_export_energy_credits, meter_data['allocated_export_energy_credits'])
    populate_tou_metric(meter.net_energy_usage_after_credits, meter_data['net_energy_usage_after_credits'])
    populate_tou_metric(meter.pce_energy_cost, meter_data['pce_energy_cost'])
    
    # Populate regular metrics
    populate_metric(meter.pce_net_generation_bonus, meter_data['pce_net_generation_bonus'])
    populate_metric(meter.pce_energy_commission_surcharge, meter_data['pce_energy_commission_surcharge'])
    populate_metric(meter.pce_total_energy_charges, meter_data['pce_total_energy_charges'])
    populate_metric(meter.pce_nem_credit, meter_data['pce_nem_credit'])
    populate_metric(meter.pce_generation_charges_due_cash, meter_data['pce_generation_charges_due_cash'])
    populate_metric(meter.pge_res_energy_charges, meter_data['pge_res_energy_charges'])
    populate_metric(meter.pge_baseline_credit, meter_data['pge_baseline_credit'])
    populate_metric(meter.pge_da_cca_charges, meter_data['pge_da_cca_charges'])
    populate_metric(meter.pge_total_energy_charges, meter_data['pge_total_energy_charges'])
    populate_metric(meter.pge_nem_billing, meter_data['pge_nem_billing'])
    populate_metric(meter.pge_minimum_delivery_charge, meter_data['pge_minimum_delivery_charge'])
    populate_metric(meter.pge_nem_true_up_adjustment, meter_data['pge_nem_true_up_adjustment'])
    populate_metric(meter.pge_electric_delivery_charges, meter_data['pge_electric_delivery_charges'])
    populate_metric(meter.california_climate_credit, meter_data['california_climate_credit'])
    populate_metric(meter.total_bill_in_mail, meter_data['total_bill_in_mail'])

def populate_tou_metric(tou_metric, tou_data):
    """Populate an EnergyMetricTOU from JSON data."""
    populate_metric(tou_metric.peak, tou_data['peak'])
    populate_metric(tou_metric.off_peak, tou_data['off_peak'])
    populate_metric(tou_metric.total, tou_data['total'])

def populate_metric(metric, metric_data):
    """Populate an EnergyMetric from JSON data."""
    if metric_data['subcomponent_values']:
        for value in metric_data['subcomponent_values']:
            metric.subcomponent_values.append(value)

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