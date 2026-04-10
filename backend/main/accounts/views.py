from django.shortcuts import render
from rest_framework import generics,permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import *
from core import settings
from django.core.mail import send_mail
from django.conf import settings
import jwt
import os
from accounts.models import *

from rest_framework.views import APIView
from firebase_admin import auth as firebase_auth
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from notes.models import *
from notes.utils.summarizer import *

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView



User = get_user_model()
# Create your views here.

class GoogleLogin(SocialLoginView):
    """
    Receives the access_token from Next.js, verifies with Google, 
    and returns our internal JWT tokens.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = os.getenv('LOCALHOST') # Matches your Next.js URL
    client_class = OAuth2Client
    permission_classes = [AllowAny]

# --- 2. PHONE OTP LOGIN FLOW ---
class SendLoginOTPView(APIView):
    """Generates and sends an OTP to a phone number for login."""
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        if not phone:
            return Response({"error": "Phone number is required"}, status=400)

        # 1. Get or Create the user (allows 'Sign up with Phone' behavior)
        user, created = User.objects.get_or_create(phone=phone, defaults={'email': f"{phone}@phone.com"})
        
        # 2. Generate OTP
        otp_code = str(random.randint(100000, 999999))
        
        # 3. Save to your existing OTP model (ensure model has a 'user' foreign key)
        PasswordResetOTP.objects.create(user=user, otp=otp_code)

        # 4. Mock SMS sending (Later connect to Twilio)
        print(f"DEBUG: SMS Sent to {phone} | OTP: {otp_code}")

        return Response({"message": "OTP sent to your phone."})

class VerifyLoginOTPView(APIView):
    """Verifies the phone OTP and returns JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        otp = request.data.get("otp")

        try:
            user = User.objects.get(phone=phone) 
            # Find the most recent OTP for this user
            otp_obj = PasswordResetOTP.objects.filter(user=user, otp=otp, is_used=False).latest("created_at") 
            
            if otp_obj.is_expired():
                return Response({"error": "OTP expired"}, status=400) 
            
            if otp_obj.failed_attempts >= 5:
                otp_obj.is_used = True
                otp_obj.save()
                return Response({"error": "Too many failed attempts. Request new one."}, status=400)
            otp_obj.is_used = True 
            otp_obj.save()

            # Success! Generate JWT tokens manually
            refresh = RefreshToken.for_user(user) 
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserProfileSerializers(user).data
            })
        except PasswordResetOTP.DoesNotExist:
            # find latest unused OTP
            otp_record = PasswordResetOTP.objects.filter(user__phone=phone, is_used=False).last() 
            if otp_record:
                otp_record.failed_attempts += 1
                otp_record.save()
            return Response({"error": "Invalid OTP"}, status=400)

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
            print(f"SMS Sent to", {user.phone}, "OTP:", {otp_code})  # Later we use Twilio

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


class FirebaseLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        firebase_token = request.data.get("token")
        
        try:
            # 1. Verify token with Firebase
            decoded_token = firebase_auth.verify_id_token(firebase_token)
            
            # Firebase gives us these fields
            email = decoded_token.get('email')
            name = decoded_token.get('name')
            phone = decoded_token.get('phone_number')
            avatar_url = decoded_token.get('picture')

            if not email:
                return Response({"error": "Firebase did not provide an email."}, status=400)

            # 2. Use 'email' as the lookup because it's your USERNAME_FIELD
            user, created = User.objects.get_or_create(
                email=email, 
                defaults={
                    'name': name,
                    'phone': phone,
                    # Note: You'd need a helper to download the image if using ImageField
                    # For now, we focus on the text fields
                }
            )

            # 3. Return your internal JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "email": user.email,
                    "name": user.name,
                    "uuid": str(user.uuid)
                }
            })

        except Exception as e:
            return Response({"error": f"Authentication failed: {str(e)}"}, status=400)