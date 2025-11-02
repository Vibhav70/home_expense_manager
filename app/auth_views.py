from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import Http404

User = get_user_model()
class RegisterView(APIView):
    """
    POST /api/register/
    Creates a new Landlord user account.
    The new user is automatically set as is_superuser for immediate Landlord privileges.
    Input: { "username": "user", "email": "user@example.com", "password": "strongpassword" }
    Permissions: AllowAny
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response(
                {"detail": "Username, email, and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. Create the user normally
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password,
            )
            
            # 2. Grant "Landlord" privileges explicitly after creation
            # This is done by setting the is_superuser and is_staff flags.
            user.is_active = True
            user.is_superuser = True
            user.is_staff = True
            user.save()
            
            return Response(
                {"detail": "Landlord account created successfully. You can now login."},
                status=status.HTTP_201_CREATED
            )
        except IntegrityError:
            return Response(
                {"detail": "A user with that username or email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Catch other potential database or creation errors
            error_message = f"Registration failed due to an unexpected error: {str(e)}"
            print(error_message) # Print to terminal for server-side debugging
            return Response(
                {"detail": error_message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """
    POST /api/login/
    Authenticates the user and returns the authentication token.
    Input: { "username": "user", "password": "strongpassword" }
    Permissions: AllowAny
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Get or create the token
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "username": user.username,
                "is_superuser": user.is_superuser, # This will now be TRUE for all new registered users
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """
    POST /api/logout/
    Deletes the user's authentication token, effectively logging them out.
    Permissions: IsAuthenticated
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Delete the token associated with the current user
            request.user.auth_token.delete()
            return Response(
                {"detail": "Successfully logged out. Token deleted."},
                status=status.HTTP_200_OK
            )
        except Exception:
            # Token might not exist or other error
            return Response(
                {"detail": "Could not log out. Token may already be invalid."},
                status=status.HTTP_400_BAD_REQUEST
            )
