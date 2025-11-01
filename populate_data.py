# This script is designed to be run via the Django shell:
# python manage.py shell < populate_data.py

import os
from django.conf import settings
from app.models import Tenant, ElectricityReading, ExpenseCategory, Expense
from decimal import Decimal
from datetime import date
from django.core.exceptions import ValidationError

print("--- Starting Data Population ---")

# --- 1. CLEAR EXISTING DATA ---
print("Clearing existing data...")
Tenant.objects.all().delete()
ElectricityReading.objects.all().delete()
ExpenseCategory.objects.all().delete()
Expense.objects.all().delete()

# --- 2. EXPENSE CATEGORIES ---
print("Creating Expense Categories...")
categories_data = [
    {"name": "Maintenance", "description": "General repairs and upkeep"},
    {"name": "Supplies", "description": "Cleaning and household supplies"},
    {"name": "Utilities (Common)", "description": "Internet, common area lighting"},
    {"name": "Capital Repair", "description": "Major investments (e.g., Water heater)"},
]
categories = {}
for data in categories_data:
    cat = ExpenseCategory.objects.create(**data)
    categories[data['name']] = cat
    print(f"Created Category: {cat.name}")

# --- 3. TENANTS ---
print("Creating Tenants...")
tenants_data = [
    {"name": "Aarav Gupta", "room_no": "R101", "contact_no": "9876543210", "joining_date": date(2024, 8, 1), "rent": Decimal("7500.00")},
    {"name": "Bela Singh", "room_no": "R102", "contact_no": "9876543211", "joining_date": date(2025, 1, 15), "rent": Decimal("6800.00")},
    {"name": "Chirag Das", "room_no": "R201", "contact_no": "9876543212", "joining_date": date(2024, 11, 1), "rent": Decimal("8200.00")},
    {"name": "Deepa Kadam", "room_no": "R202", "contact_no": "9876543213", "joining_date": date(2025, 3, 1), "rent": Decimal("7100.00")},
    {"name": "Esha Patil", "room_no": "R301", "contact_no": "9876543214", "joining_date": date(2024, 7, 1), "rent": Decimal("9000.00")},
    {"name": "Fahad Khan", "room_no": "R302", "contact_no": "9876543215", "joining_date": date(2025, 4, 10), "rent": Decimal("6500.00")},
    {"name": "Gita Menon", "room_no": "R401", "contact_no": "9876543216", "joining_date": date(2024, 10, 1), "rent": Decimal("8500.00")},
]

tenants = {}
for data in tenants_data:
    tenant = Tenant.objects.create(**data)
    tenants[data['room_no']] = tenant
    print(f"Created Tenant: {tenant.name}")

# --- 4. ELECTRICITY READINGS (SEPTEMBER & OCTOBER 2025) ---
print("Creating Electricity Readings (Sept & Oct 2025)...")

# Sept Readings (All Paid)
sept_readings = [
    # Tenant, Prev, Curr, Rate, Month, Year, Paid
    (tenants['R101'], 100.0, 220.0, 6.5, 9, 2025, True), # Units: 120, Bill: 780.00
    (tenants['R102'], 50.0, 150.0, 6.5, 9, 2025, True),  # Units: 100, Bill: 650.00
    (tenants['R201'], 300.0, 410.0, 7.0, 9, 2025, True),  # Units: 110, Bill: 770.00
    (tenants['R202'], 150.0, 260.0, 7.0, 9, 2025, True),  # Units: 110, Bill: 770.00
    (tenants['R301'], 500.0, 650.0, 6.0, 9, 2025, True),  # Units: 150, Bill: 900.00
    (tenants['R302'], 200.0, 270.0, 6.0, 9, 2025, True),  # Units: 70, Bill: 420.00
    (tenants['R401'], 400.0, 520.0, 7.5, 9, 2025, True),  # Units: 120, Bill: 900.00
]

# Oct Readings (Mixed Paid Status)
oct_readings = [
    # Tenant, Prev, Curr, Rate, Month, Year, Paid
    (tenants['R101'], 220.0, 350.0, 6.5, 10, 2025, False), # Units: 130, Bill: 845.00
    (tenants['R102'], 150.0, 240.0, 6.5, 10, 2025, False), # Units: 90, Bill: 585.00
    (tenants['R201'], 410.0, 500.0, 7.0, 10, 2025, True),  # Units: 90, Bill: 630.00
    (tenants['R202'], 260.0, 360.0, 7.0, 10, 2025, True),  # Units: 100, Bill: 700.00
    (tenants['R301'], 650.0, 800.0, 6.0, 10, 2025, False), # Units: 150, Bill: 900.00
    (tenants['R302'], 270.0, 330.0, 6.0, 10, 2025, True),  # Units: 60, Bill: 360.00
    (tenants['R401'], 520.0, 650.0, 7.5, 10, 2025, False), # Units: 130, Bill: 975.00
]

all_readings = sept_readings + oct_readings

for tenant, prev, curr, rate, month, year, paid in all_readings:
    reading = ElectricityReading(
        tenant=tenant,
        month=month,
        year=year,
        previous_reading=Decimal(prev),
        current_reading=Decimal(curr),
        rate_per_unit=Decimal(rate),
        is_paid=paid # This will be reset if it's a new month, but we set it here for initial status
    )
    # Call save() to trigger automatic bill calculation
    reading.save()
    print(f"  - Reading for {tenant.name} ({month}/{year}): Units={reading.total_units}, Bill={reading.calculated_bill}, Paid={reading.is_paid}")


# --- 5. EXPENSES ---
print("Creating Household Expenses...")

expenses_data = [
    # Date, Amount, Description, Category
    (date(2025, 10, 5), Decimal("1500.00"), "Plumbing service for common bathroom", categories["Maintenance"]),
    (date(2025, 10, 10), Decimal("350.00"), "Cleaning liquid and sponges", categories["Supplies"]),
    (date(2025, 9, 28), Decimal("4200.00"), "Replacement of main water heater unit", categories["Capital Repair"]),
    (date(2025, 10, 15), Decimal("800.00"), "Broadband internet subscription for common area", categories["Utilities (Common)"]),
    (date(2025, 10, 20), Decimal("600.00"), "Electrical socket repair in R101 (Landlord covered)", categories["Maintenance"]),
    (date(2025, 9, 1), Decimal("300.00"), "Light bulbs for hallway", categories["Supplies"]),
    (date(2025, 9, 15), Decimal("1200.00"), "Annual fire extinguisher servicing", categories["Maintenance"]),
    (date(2025, 10, 25), Decimal("450.00"), "Common area sweeping and cleaning service", categories["Maintenance"]),
    (date(2025, 10, 30), Decimal("120.00"), "Dustbin liners and trash bags", categories["Supplies"]),
    (date(2025, 8, 1), Decimal("150.00"), "Gardening tools purchase", categories["Supplies"]),
]

for exp_date, amount, desc, category in expenses_data:
    # Month/year will be automatically derived from the date in the model's save method
    expense = Expense(
        category=category,
        amount=amount,
        date=exp_date,
        description=desc,
        # Month and year will be overridden by the model save logic if we rely on it
    )
    expense.save()
    print(f"  - Expense: {desc[:30]}... ({expense.amount}) in {expense.month}/{expense.year}")


print("\n--- Data Population Complete ---")

# Calculate totals for quick verification in the shell
total_rent_oct = sum(t.rent for t in Tenant.objects.all())
total_electricity_oct = sum(r.calculated_bill for r in ElectricityReading.objects.filter(month=10, year=2025))
total_expenses_oct = sum(e.amount for e in Expense.objects.filter(month=10, year=2025))

net_balance_oct = total_rent_oct - (total_electricity_oct + total_expenses_oct)

print(f"\n--- OCT 2025 Summary for Debugging ---")
print(f"Total Rent: ₹{total_rent_oct.quantize(Decimal('0.01'))}")
print(f"Total Electricity Bills: ₹{total_electricity_oct.quantize(Decimal('0.01'))}")
print(f"Total Other Expenses: ₹{total_expenses_oct.quantize(Decimal('0.01'))}")
print(f"NET BALANCE: ₹{net_balance_oct.quantize(Decimal('0.01'))}")
