from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tenant, ElectricityReading  , ExpenseCategory, Expense

# Get the User model
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
    The 'owner' field is made read-only as it is set by the request.user in the ViewSet.
    """
    # The 'owner' field is automatically populated by the view, so we make it read-only
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Tenant
        fields = [
            'id', 'owner', 'owner_username', 'name', 'room_no', 'contact_no', 
            'joining_date', 'leaving_date', 'rent'
        ]
        # Crucial: Mark owner as read-only so the serializer doesn't require it in POST/PUT data.
        read_only_fields = ['owner'] # <--- THE FIX

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


    def validate(self, data):
        """
        Custom validation to ensure month is between 1 and 12.
        """
        month = data.get('month', self.instance.month if self.instance else None)
        if month is not None and not (1 <= month <= 12):
            raise serializers.ValidationError(
                {"month": "Month must be an integer between 1 and 12."}
            )

        return data


# --- New Expense Serializers ---

class ExpenseCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the ExpenseCategory model.
    """
    # The 'owner' field is automatically populated by the view, so we make it read-only
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = ExpenseCategory
        fields = ['id', 'owner', 'owner_username', 'name', 'description']
        read_only_fields = ['owner'] # <--- THE FIX

class ExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer for the Expense model.
    """
    # Display the category name instead of just the ID
    category_name = serializers.ReadOnlyField(source='category.name')
    # The 'owner' field is automatically populated by the view, so we make it read-only
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Expense
        fields = [
            'id', 'owner', 'owner_username', 'category', 'category_name', 'amount', 'date',
            'description', 'month', 'year'
        ]
        read_only_fields = ['owner'] # <--- THE FIX
