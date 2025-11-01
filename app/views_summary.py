from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum
from django.core.exceptions import ObjectDoesNotExist
from . models import Tenant, ElectricityReading, Expense
import calendar # Used to convert month number to name

class MonthlySummaryView(APIView):
    """
    API view to provide a consolidated financial summary for a given month and year.
    Requires 'month' (1-12) and 'year' (YYYY) query parameters.
    Example: /api/monthly-summary/?month=10&year=2025
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # 1. Input Validation and Extraction
        month_str = request.query_params.get('month')
        year_str = request.query_params.get('year')

        if not month_str or not year_str:
            return Response(
                {"error": "Both 'month' and 'year' parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            month = int(month_str)
            year = int(year_str)
            if not (1 <= month <= 12):
                 raise ValueError("Month must be between 1 and 12.")
        except ValueError as e:
            return Response(
                {"error": f"Invalid month or year format: {e}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Calculate Total Rent and Tenant Summary
        all_tenants = Tenant.objects.all()
        total_rent = sum(tenant.rent for tenant in all_tenants)
        total_electricity = 0
        tenants_summary = []

        # Find the specific reading for each tenant
        for tenant in all_tenants:
            try:
                # Use .get() to find the unique reading for this tenant/month/year
                reading = ElectricityReading.objects.get(
                    tenant=tenant,
                    month=month,
                    year=year
                )
                bill_amount = reading.calculated_bill
                is_paid_status = reading.is_paid

            except ObjectDoesNotExist:
                # If no reading exists for a tenant for this month, bill is 0
                bill_amount = 0
                is_paid_status = False

            total_electricity += bill_amount

            tenants_summary.append({
                "tenant_id": tenant.id,
                "name": tenant.name,
                "room_no": tenant.room_no,
                "bill": bill_amount,
                "is_paid": is_paid_status,
            })

        # 3. Calculate Total Other Expenses
        expense_summary = Expense.objects.filter(
            month=month,
            year=year
        ).aggregate(
            total_amount=Sum('amount')
        )
        # Use .get() to safely retrieve the aggregated value, default to 0
        total_other_expenses = expense_summary.get('total_amount') or 0

        # 4. Calculate Net Balance
        total_outgoing = total_electricity + total_other_expenses
        net_balance = total_rent - total_outgoing

        # 5. Prepare Final Response
        response_data = {
            "month": calendar.month_name[month],
            "year": year,
            "tenants": tenants_summary,
            "total_rent": total_rent,
            "total_electricity": total_electricity,
            "total_other_expenses": total_other_expenses,
            "net_balance": net_balance,
        }

        return Response(response_data, status=status.HTTP_200_OK)
