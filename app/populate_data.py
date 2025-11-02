import os
import django
from django.db import IntegrityError
from django.contrib.auth import get_user_model

# --- Setup Environment (Required if running outside of manage.py) ---
# NOTE: If you run this file via 'python manage.py runscript seed_categories', 
# you don't need these lines.
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project_name.settings')
# django.setup()
# -------------------------------------------------------------------

# Get the historical models
from app.models import ExpenseCategory

User = get_user_model()

# --- Configuration ---
# You can change the USER_ID to match the ID of your admin/landlord account.
DEFAULT_OWNER_ID = 1

CATEGORIES_TO_CREATE = [
    ('Plumber', "Maintenance expense for plumbing services."),
    ('Carpenter', "Maintenance expense for carpentry services."),
    ('Painter', "Maintenance expense for painting and touch-ups."),
    ('Electrician', "Maintenance expense for electrical services."),
    ('Pest', "Maintenance expense for pest control."),
]
# ---------------------


def seed_default_categories(owner_id):
    """
    Creates the default expense categories for a specific user.
    """
    try:
        owner = User.objects.get(pk=owner_id)
    except User.DoesNotExist:
        print(f"Error: Owner with ID {owner_id} not found. Cannot create categories.")
        print("Please create a superuser first.")
        return

    print(f"Attempting to create categories for user: {owner.username} (ID: {owner.id})")
    
    existing_names = ExpenseCategory.objects.filter(owner=owner).values_list('name', flat=True)
    
    categories_created_count = 0
    categories_skipped_count = 0

    for name, description in CATEGORIES_TO_CREATE:
        if name not in existing_names:
            try:
                ExpenseCategory.objects.create(
                    owner=owner,
                    name=name,
                    description=description
                )
                print(f"  [CREATED] {name}")
                categories_created_count += 1
            except IntegrityError as e:
                # Catch case where concurrent creation might cause issues
                print(f"  [ERROR] Failed to create {name}: {e}")
            except Exception as e:
                print(f"  [ERROR] An unexpected error occurred for {name}: {e}")
        else:
            print(f"  [SKIPPED] {name} already exists.")
            categories_skipped_count += 1

    print("-" * 40)
    print(f"Seeding Complete: {categories_created_count} created, {categories_skipped_count} skipped.")


if __name__ == '__main__':
    # You typically run this code directly in the Django shell
    print("--- CATEGORY SEEDING SCRIPT ---")
    seed_default_categories(DEFAULT_OWNER_ID)

# Example of how to run this code:
# 1. Save it as 'seed_categories.py' in your app directory.
# 2. Open your terminal in the project root (where manage.py is).
# 3. Run: python manage.py shell
# 4. In the shell, type: exec(open('app/seed_categories.py').read())
