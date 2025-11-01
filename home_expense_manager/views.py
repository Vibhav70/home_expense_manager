from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class HealthCheckView(APIView):
    """
    API view to check the health and status of the application.
    Returns a simple JSON object: { "status": "ok" }.
    """
    permission_classes = [] # Allow unauthenticated access for health check

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests and returns a success status.
        """
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
