import datetime
from django.db.models import Sum, DecimalField
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models.functions import Coalesce
from django.db.models import Q # Need to import Q for the lookup logic
from django.core.exceptions import ObjectDoesNotExist # Import for safer error handling

from app.models import Tenant, ElectricityReading, ExpenseCategory, Expense
from app.serializers import (
    TenantSerializer,
    ElectricityReadingSerializer,
    ExpenseCategorySerializer,
    ExpenseSerializer,
    UserSerializer,
)
from app.permissions import IsSuperUserOrReadOnly as IsLandlordOrReadOnly


class TenantViewSet(viewsets.ModelViewSet):
    """
    CRUD for Tenants. Restricted to Landlord (superuser) for write operations.
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated, IsLandlordOrReadOnly]


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for Expense Categories. Restricted to Landlord (superuser) for write operations.
    """
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsLandlordOrReadOnly]


class ElectricityReadingViewSet(viewsets.ModelViewSet):
    """
    CRUD for Electricity Readings. Restricted to Landlord (superuser) for write operations.
    Allows filtering by tenant, month, and year.
    Admin can view all readings (GET is safe for IsAuthenticated users).
    """
    serializer_class = ElectricityReadingSerializer
    permission_classes = [IsAuthenticated, IsLandlordOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tenant', 'month', 'year', 'is_paid'] # Added is_paid filter
    
    # REQUIRED for DRF Router to function
    queryset = ElectricityReading.objects.all()

    def get_queryset(self):
        """
        Optionally restricts the returned readings to the current month/year 
        if no filters are explicitly provided.
        """
        queryset = ElectricityReading.objects.all()
        
        # If no month or year filter is present, default to current month/year
        if not (self.request.query_params.get('month') or self.request.query_params.get('year')):
            today = datetime.date.today()
            queryset = queryset.filter(month=today.month, year=today.year)

        return queryset.select_related('tenant')

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def get_previous_reading(self, request):
        """
        Custom action to fetch the last recorded current reading for a given tenant.
        
        Usage: /api/readings/get_previous_reading/?tenant_id=X&month=Y&year=Z
               OR: /api/readings/get_previous_reading/?tenant=X&month=Y&year=Z (for compatibility)
        
        Returns the last reading's 'current_reading' value, which should be the
        'previous_reading' for the new entry.
        """
        
        tenant_id = request.query_params.get('tenant_id') or request.query_params.get('tenant')
        month_str = request.query_params.get('month')
        year_str = request.query_params.get('year')

        if not tenant_id:
            return Response({"error": "Missing tenant or tenant_id parameter."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Validate Tenant and Date Inputs
            tenant = Tenant.objects.get(pk=tenant_id)
            month = int(month_str) if month_str else datetime.date.today().month
            year = int(year_str) if year_str else datetime.date.today().year

            # 2. Look up the latest reading for this tenant that occurred *before* the current period
            last_reading = ElectricityReading.objects.filter(
                tenant=tenant
            ).filter(
                # Filters for all readings with a year less than current year,
                # OR readings in the same year but with a month less than the current month.
                Q(year__lt=year) | Q(year=year, month__lt=month)
            ).order_by('-year', '-month').first()

            # 3. Determine the previous reading value (0.0 if not found)
            previous_reading_value = float(last_reading.current_reading) if last_reading else 0.0

            return Response({
                "previous_reading": previous_reading_value
            }, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            # Handle Tenant not found
            return Response({"error": "Tenant not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            # Handle non-integer month/year
            return Response({"error": "Month and year must be valid integers."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Default to 0 if any unexpected lookup error occurs (e.g., if current_reading field is bad)
            # Log the error for debugging but return a safe value to the client
            print(f"Unexpected error retrieving previous reading for Tenant {tenant_id}: {e}") 
            return Response({
                "previous_reading": 0.0 # Fail safe response
            }, status=status.HTTP_200_OK)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    CRUD for Expenses. Restricted to Landlord (superuser) for write operations.
    Allows filtering by month and year.
    """
    queryset = Expense.objects.select_related('category').all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsLandlordOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['month', 'year']


# --- New Admin Utility Endpoint ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsLandlordOrReadOnly]) # Only superuser/admin should use this
def missing_readings_check(request):
    """
    GET /api/readings/check/?month=X&year=Y
    Identifies which active tenants are missing an electricity reading for the given period.
    """
    month_str = request.query_params.get('month')
    year_str = request.query_params.get('year')

    if not month_str or not year_str:
        return Response({"error": "Missing month and year query parameters."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        month = int(month_str)
        year = int(year_str)
    except ValueError:
        return Response({"error": "Month and year must be integers."}, status=status.HTTP_400_BAD_REQUEST)
        
    # Get all active tenants
    all_tenants = Tenant.objects.all() 
    
    # Find IDs of tenants who HAVE a reading for this month/year
    tenants_with_readings_ids = ElectricityReading.objects.filter(
        month=month, year=year
    ).values_list('tenant_id', flat=True)
    
    # Filter all tenants to find those whose ID is NOT in the list above
    missing_readings_tenants = all_tenants.exclude(
        id__in=tenants_with_readings_ids
    )

    # Serialize the tenants who are missing a reading
    serializer = TenantSerializer(missing_readings_tenants, many=True)

    return Response({
        "month": month,
        "year": year,
        "missing_count": missing_readings_tenants.count(),
        "missing_tenants": serializer.data,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_summary(request):
    """
    API endpoint to retrieve a financial summary for a given month and year.
    """
    month = request.query_params.get('month')
    year = request.query_params.get('year')

    if not month or not year:
        return Response({"error": "Missing month and year query parameters."}, status=400)

    try:
        month = int(month)
        year = int(year)
    except ValueError:
        return Response({"error": "Month and year must be integers."}, status=400)

    # 1. Fetch Electricity Readings for the period
    readings = ElectricityReading.objects.filter(month=month, year=year).select_related('tenant')

    tenant_summary = []
    total_electricity_bill = 0

    for reading in readings:
        tenant_summary.append({
            "id": reading.tenant.id,
            "name": reading.tenant.name,
            "room_no": reading.tenant.room_no,
            "total_units": float(reading.total_units),
            "bill": float(reading.calculated_bill),
            "is_paid": reading.is_paid
        })
        total_electricity_bill += float(reading.calculated_bill)

    # 2. Calculate Total Rent (Income)
    # Filter for active tenants (or all tenants for full rent)
    # Simple calculation: sum of rent of all tenants currently stored.
    total_rent_income_qs = Tenant.objects.aggregate(
        total=Coalesce(Sum('rent', output_field=DecimalField()), 0)
    )
    total_rent_income = float(total_rent_income_qs['total'])

    # 3. Calculate Total Other Expenses
    total_expenses_qs = Expense.objects.filter(
        month=month, year=year
    ).aggregate(
        total=Coalesce(Sum('amount', output_field=DecimalField()), 0)
    )
    total_other_expenses = float(total_expenses_qs['total'])

    # 4. Calculate Net Balance
    total_costs = total_electricity_bill + total_other_expenses
    net_balance = total_rent_income - total_costs

    return Response({
        "month": datetime.date(year, month, 1).strftime('%B'),
        "year": year,
        "tenants": tenant_summary,
        "total_electricity": round(total_electricity_bill, 2),
        "total_rent": round(total_rent_income, 2),
        "total_other_expenses": round(total_other_expenses, 2),
        "net_balance": round(net_balance, 2)
    })
