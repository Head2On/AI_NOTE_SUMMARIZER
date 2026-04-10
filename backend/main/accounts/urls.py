from django.urls import path
from .views import *

urlpatterns = [
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('phone/', SendLoginOTPView.as_view(), name='phone_send'),
    path('phone/verify/', VerifyLoginOTPView.as_view(), name='phone_verify'),
    path('firebase/', FirebaseLoginView.as_view(), name='firebase_login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordDualView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordOTPView.as_view(), name='reset-password'),
]
