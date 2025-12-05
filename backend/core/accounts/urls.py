from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordDualView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordOTPView.as_view(), name='reset-password'),
]
