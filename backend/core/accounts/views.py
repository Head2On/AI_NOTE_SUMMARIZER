from django.shortcuts import render
from rest_framework import generics,permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import *
from core import settings
from django.core.mail import send_mail
from django.conf import settings
import jwt
from accounts.models import *
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from notes.models import Note
from notes.utils.summarizer import *



User = get_user_model()
# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) #for anyone
    serializer_class = UserSerializer

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"})
        except Exception as e:
            return Response({"error": "Invalid token"}, status=400)
        
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializers
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"error": "Old password is incorrect"}, status=400)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({"message": "Password update successfully"})
    

class ForgotPasswordDualView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get("identifier")  # can be email or phone

        if not identifier:
            return Response({"error": "Email or phone required"}, status=400)

        # Fetch user by email or phone
        try:
            user = User.objects.get(email=identifier) if "@" in identifier else User.objects.get(phone=identifier)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Generate OTP
        otp_code = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.create(user=user, otp=otp_code)

        # Send via Email OR SMS
        if "@" in identifier:
            send_mail(
                "Password Reset OTP",
                f"Your OTP is {otp_code}. Valid for 10 minutes.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        else:
            print("SMS Sent to", user.phone, "OTP:", otp_code)  # Later we use Twilio

        return Response({"message": "OTP sent to your email/phone"})

class ResetPasswordOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get("identifier")
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")

        if not identifier or not otp or not new_password:
            return Response({"error": "identifier, otp, new_password required"}, status=400)

        try:
            user = User.objects.get(email=identifier) if "@" in identifier else User.objects.get(phone=identifier)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        try:
            reset_obj = PasswordResetOTP.objects.filter(user=user, otp=otp).latest("created_at")
        except:
            return Response({"error": "Invalid OTP"}, status=400)

        if reset_obj.is_expired():
            return Response({"error": "OTP expired"}, status=400)

        # Reset password
        user.set_password(new_password)
        user.save()

        return Response({"message": "Password changed successfully!"})
