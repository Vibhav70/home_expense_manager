from django.contrib import admin
from django.urls import path, include
# from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Health check and core app endpoints
    path('api/', include('app.urls')),

    # # API Documentation routes (drf-spectacular)
    # path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # # Optional: Swagger UI for browsing the API
    # path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
