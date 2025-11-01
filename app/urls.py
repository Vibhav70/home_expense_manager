from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # HealthCheckView,
    TenantViewSet,
    ElectricityReadingViewSet,
    ExpenseCategoryViewSet,
    ExpenseViewSet
)
from .views_summary import MonthlySummaryView
from .auth_views import RegisterView, LoginView, LogoutView # <-- Import Auth Views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'tenants', TenantViewSet)
router.register(r'readings', ElectricityReadingViewSet)
router.register(r'categories', ExpenseCategoryViewSet)
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    # Health check endpoint
    # path('health/', HealthCheckView.as_view(), name='health_check'),

    # Authentication Endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # New custom summary endpoint
    # The full path will be /api/monthly-summary/
    path('monthly-summary/', MonthlySummaryView.as_view(), name='monthly_summary'),

    # API endpoints registered with the router
    path('', include(router.urls)),
]
