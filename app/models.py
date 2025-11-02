import datetime
from django.db import models
from django.db.models import UniqueConstraint, Q
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator 
from django.contrib.auth import get_user_model

User = get_user_model()

# Defensive measure to help Django's system check avoid circular import confusion
class SentinelManager(models.Manager):
    pass

class Tenant(models.Model):
    """Stores tenant information."""
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_tenants')

    name = models.CharField(max_length=100)
    room_no = models.CharField(max_length=10, unique=True)
    contact_no = models.CharField(max_length=20)
    joining_date = models.DateField(default=datetime.date.today)
    leaving_date = models.DateField(null=True, blank=True)
    rent = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        # Ensure room_no is unique ONLY per owner (Landlord)
        constraints = [
            UniqueConstraint(fields=['owner', 'room_no'], name='unique_room_per_owner')
        ]

    def __str__(self):
        return f"{self.name} ({self.room_no})"

class ExpenseCategory(models.Model):
    """Categories for tracking household expenses."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_categories')
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        constraints = [
            UniqueConstraint(fields=['owner', 'name'], name='unique_category_per_owner')
        ]

    def __str__(self):
        return self.name

class ElectricityReading(models.Model):
    """
    Stores monthly electricity readings for a tenant and auto-calculates bill.
    """
    # ADDING related_name='electricity_readings' to resolve the E304/E305 clash
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='electricity_readings')
    month = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    year = models.IntegerField(validators=[MinValueValidator(2000), MaxValueValidator(2100)])
    
    # Previous reading will often be auto-filled by the save() method logic
    previous_reading = models.DecimalField(max_digits=10, decimal_places=2)
    current_reading = models.DecimalField(max_digits=10, decimal_places=2)
    rate_per_unit = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Auto-calculated fields
    total_units = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    calculated_bill = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    is_paid = models.BooleanField(default=False)

    class Meta:
        # Enforce only one reading per tenant per month/year
        constraints = [
            UniqueConstraint(fields=['tenant', 'month', 'year'], name='unique_reading_per_month_year')
        ]
        ordering = ['-year', '-month', 'tenant__room_no']

    def clean(self):
        if self.current_reading < self.previous_reading:
            raise ValidationError(
                _('Current reading must be greater than or equal to the previous reading.')
            )

    def save(self, *args, **kwargs):
        # 1. Automatic Calculation
        self.total_units = self.current_reading - self.previous_reading
        self.calculated_bill = self.total_units * self.rate_per_unit
        
        # 2. Check for automatic previous reading update (only on create)
        if not self.pk:
            try:
                last_reading = ElectricityReading.objects.filter(
                    tenant=self.tenant
                ).filter(

                    Q(year__lt=self.year) | Q(year=self.year, month__lt=self.month)
                ).order_by('-year', '-month').first() 

                if last_reading:
                    self.previous_reading = last_reading.current_reading
            except Exception:
                pass
                
        # 3. If a new month's reading is being created (pk is None), ensure is_paid is False
        if not self.pk:
             self.is_paid = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"E-Reading for {self.tenant.name} - {self.month}/{self.year}"

class Expense(models.Model):
    """Stores household expenses linked to a category."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_expenses', default=None, null=True)
    # CHANGING related_name='expenses' to related_name='category_expenses' to resolve the E304/E305 clash
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, related_name='category_expenses')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=datetime.date.today)
    description = models.TextField(blank=True)
    
    # Store month and year for easier querying
    month = models.IntegerField(editable=False)
    year = models.IntegerField(editable=False)

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        # Automatically set month and year from the date field
        self.month = self.date.month
        self.year = self.date.year
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category.name}: ₹{self.amount} ({self.date})"
