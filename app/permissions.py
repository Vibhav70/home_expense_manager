from rest_framework import permissions

class IsSuperUserOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow superusers (the "landlord") to perform
    write operations (POST, PUT, DELETE).
    Read operations (GET, HEAD, OPTIONS) are allowed for all authenticated users.
    """

    def has_permission(self, request, view):
        # Allow read permissions (GET, HEAD, OPTIONS) for any authenticated request.
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions (POST, PUT, PATCH, DELETE) are only allowed to superusers.
        return request.user and request.user.is_superuser
