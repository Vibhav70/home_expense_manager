from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Tenant, ElectricityReading, ExpenseCategory, Expense

# Get the User model for the new UserSerializer
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the default or custom Django User model.
    Includes key identification and authentication fields.
    """
    class Meta:
        model = User
        fields = (
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'is_superuser'
        )
        # Commonly, these are set to read-only for basic user profile views
        read_only_fields = ('email', 'is_superuser')


class TenantSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tenant model.
    """
    class Meta:
        model = Tenant
        fields = '__all__'

class ElectricityReadingSerializer(serializers.ModelSerializer):
    """
    Serializer for the ElectricityReading model.
    Handles read-only fields and basic validation.
    """
    # Display the tenant's name and room number for readability
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    tenant_room_no = serializers.ReadOnlyField(source='tenant.room_no')

    class Meta:
        model = ElectricityReading
        fields = [
            'id', 'tenant', 'tenant_name', 'tenant_room_no',
            'month', 'year', 'previous_reading', 'current_reading',
            'rate_per_unit', 'total_units', 'calculated_bill', 'is_paid'
        ]
        # Make auto-calculated fields read-only
        read_only_fields = ['total_units', 'calculated_bill']

    
    def to_internal_value(self, data):
        """
        Populate the previous_reading field if it is missing or explicitly set to 0,
        by looking up the last reading for the given tenant/month/year combination.
        """
        # Call the base method first to validate basic field types
        validated_data = super().to_internal_value(data)
        
        # Check if we are creating a new record and if previous_reading is 0 
        # (or missing/None, which is handled by super().to_internal_value)
        # We check the raw data for 'previous_reading' to allow the user to override it.
        # This is primarily for POST requests (new creation).
        raw_previous_reading = data.get('previous_reading')
        
        # We only want to auto-calculate if the user explicitly provided '0' or left it out
        # AND if we have enough info (tenant, month, year)
        if (raw_previous_reading == 0 or raw_previous_reading is None) and validated_data.get('tenant'):
            try:
                tenant = validated_data['tenant']
                month = validated_data.get('month')
                year = validated_data.get('year')

                if month and year:
                    # Look up the latest reading for this tenant before the current period
                    last_reading = ElectricityReading.objects.filter(
                        tenant=tenant
                    ).filter(
                        Q(year__lt=year) | Q(year=year, month__lt=month)
                    ).order_by('-year', '-month').first()

                    if last_reading:
                        # Override the previous_reading with the last month's current reading
                        validated_data['previous_reading'] = last_reading.current_reading
            except Exception:
                # Silently fail if lookup causes an error
                pass
        
        return validated_data

    
    def validate(self, data):
        """
        Custom validation to ensure month is between 1 and 12.
        """
        month = data.get('month', self.instance.month if self.instance else None)
        if month is not None and not (1 <= month <= 12):
            raise serializers.ValidationError(
                {"month": "Month must be an integer between 1 and 12."}
            )

        # The model's save method handles the reading value consistency and
        # the UniqueConstraint handles the tenant/month/year uniqueness.

        return data


# --- New Expense Serializers ---

class ExpenseCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the ExpenseCategory model.
    """
    class Meta:
        model = ExpenseCategory
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer for the Expense model.
    """
    # Display the category name instead of just the ID
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Expense
        fields = [
            'id', 'category', 'category_name', 'amount', 'date',
            'description', 'month', 'year'
        ]
