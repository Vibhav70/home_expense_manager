import datetime
from django.db.models import Sum, DecimalField
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.db.models import Q

from app.models import Tenant, ElectricityReading, ExpenseCategory, Expense
from app.serializers import (
    TenantSerializer,
    ElectricityReadingSerializer,
    ExpenseCategorySerializer,
    ExpenseSerializer,
    UserSerializer,
)
from app.permissions import  IsLandlordOrReadOnly


class BaseOwnerViewSet(viewsets.ModelViewSet):
    """
    Base class to handle multi-tenancy filtering and owner assignment.
    """
    permission_classes = [IsAuthenticated, IsLandlordOrReadOnly]
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        """
        Filter queryset to only return objects owned by the current authenticated user.
        """
        if self.request.user.is_authenticated:
            # All models linked directly to 'owner'
            return self.queryset.filter(owner=self.request.user)
        return self.queryset.none() # Return empty queryset if user is not authenticated

    def perform_create(self, serializer):
        """
        Inject the current authenticated user as the 'owner' upon creation.
        """
        # Inject the owner automatically before saving the instance
        serializer.save(owner=self.request.user)


class TenantViewSet(BaseOwnerViewSet):
    """
    CRUD for Tenants. Filters by owner.
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer


class ExpenseCategoryViewSet(BaseOwnerViewSet):
    """
    CRUD for Expense Categories. Filters by owner.
    """
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer


class ElectricityReadingViewSet(viewsets.ModelViewSet):
    """
    CRUD for Electricity Readings.
    Filtering is done implicitly via Tenant ownership.
    """
    serializer_class = ElectricityReadingSerializer
    permission_classes = [IsAuthenticated, IsLandlordOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tenant', 'month', 'year']
    
    # REQUIRED for DRF Router to function
    # Note: Queryset defined here must be filtered in get_queryset below.
    queryset = ElectricityReading.objects.select_related('tenant').all()

    def get_queryset(self):
        """
        Filters readings based on the current user's ownership of the Tenant.
        """
        if not self.request.user.is_authenticated:
            return ElectricityReading.objects.none()

        # Filter readings whose tenant's owner is the current user
        queryset = ElectricityReading.objects.filter(
            tenant__owner=self.request.user
        ).select_related('tenant')
        
        # Apply optional month/year filtering only if provided (otherwise default logic applies)
        if self.request.query_params.get('month') or self.request.query_params.get('year'):
            month = self.request.query_params.get('month')
            year = self.request.query_params.get('year')
            if month:
                queryset = queryset.filter(month=month)
            if year:
                queryset = queryset.filter(year=year)
        else:
            # If no month or year filter is present, default to current month/year
            today = datetime.date.today()
            queryset = queryset.filter(month=today.month, year=today.year)


        return queryset

    def perform_create(self, serializer):
        """
        Ensure the Tenant being linked belongs to the current Landlord.
        """
        tenant_id = self.request.data.get('tenant')
        # Get the Tenant object, ensuring it's owned by the current user
        tenant_instance = get_object_or_404(
            Tenant.objects.filter(owner=self.request.user), pk=tenant_id
        )
        
        # Pass the verified tenant instance to the serializer's save method
        serializer.save(tenant=tenant_instance)


    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def get_previous_reading(self, request):
        """
        Custom action to fetch the last recorded reading for a specific tenant and period.
        The Tenant must be owned by the current user.
        Example: /api/readings/get_previous_reading/?tenant_id=1&month=11&year=2025
        """
        tenant_id = request.query_params.get('tenant_id') 
        month_str = request.query_params.get('month')
        year_str = request.query_params.get('year')

        if not all([tenant_id, month_str, year_str]):
            return Response({"error": "Missing tenant_id, month, or year parameters."}, status=400)

        try:
            tenant_id = int(tenant_id)
            month = int(month_str)
            year = int(year_str)
        except ValueError:
            return Response({"error": "Month, year, and tenant_id must be integers."}, status=400)

        # 1. Verify Tenant Ownership and Existence
        try:
            tenant_instance = Tenant.objects.get(pk=tenant_id, owner=request.user)
        except Tenant.DoesNotExist:
            return Response({"error": "Tenant not found or does not belong to you."}, status=404)

        # 2. Query for the absolute last reading BEFORE the current period
        try:
            last_reading = ElectricityReading.objects.filter(
                tenant=tenant_instance
            ).filter(
                Q(year__lt=year) | Q(year=year, month__lt=month)
            ).order_by('-year', '-month').first()

            previous_reading = float(last_reading.current_reading) if last_reading else 0.0

            return Response({"previous_reading": previous_reading})

        except Exception as e:
            # Fallback for unexpected errors during lookup
            print(f"Error during previous reading lookup: {e}")
            return Response({"previous_reading": 0.0})


class ExpenseViewSet(BaseOwnerViewSet):
    """
    CRUD for Expenses. Filters by owner and allows filtering by month and year.
    """
    queryset = Expense.objects.select_related('category').all()
    serializer_class = ExpenseSerializer
    filterset_fields = ['month', 'year', 'category'] # Added category filter for convenience
    
    def perform_create(self, serializer):
        """
        Ensure the ExpenseCategory being linked belongs to the current Landlord
        and inject the current authenticated user as the 'owner'.
        """
        category_id = self.request.data.get('category')
        
        # 1. Verify Category Ownership (if category is provided)
        if category_id:
            get_object_or_404(
                ExpenseCategory.objects.filter(owner=self.request.user), pk=category_id
            )
        
        # 2. Inject the owner automatically before saving the instance
        serializer.save(owner=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_summary(request):
    """
    API endpoint to retrieve a financial summary for a given month and year,
    filtered by the current Landlord (Owner).
    """
    month = request.query_params.get('month')
    year = request.query_params.get('year')
    user = request.user

    if not month or not year:
        return Response({"error": "Missing month and year query parameters."}, status=400)

    try:
        month = int(month)
        year = int(year)
    except ValueError:
        return Response({"error": "Month and year must be integers."}, status=400)

    # 1. Fetch Tenants (Income source) for the current user
    user_tenants = Tenant.objects.filter(owner=user)

    # 2. Calculate Total Rent (Income) - Sum of rent for all owned tenants
    total_rent_income_qs = user_tenants.aggregate(
        total=Coalesce(Sum('rent', output_field=DecimalField()), 0)
    )
    total_rent_income = float(total_rent_income_qs['total'])

    # 3. Fetch Electricity Readings for the period, linked through the user's tenants
    readings = ElectricityReading.objects.filter(
        tenant__in=user_tenants, 
        month=month, 
        year=year
    ).select_related('tenant')

    tenant_summary = []
    total_electricity_bill = 0

    # Summarize electricity bill per tenant
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

    # 4. Calculate Total Other Expenses, owned by the current user
    total_expenses_qs = Expense.objects.filter(
        owner=user,
        month=month, year=year
    ).aggregate(
        total=Coalesce(Sum('amount', output_field=DecimalField()), 0)
    )
    total_other_expenses = float(total_expenses_qs['total'])

    # 5. Calculate Net Balance
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
