from celery import shared_task
from django.utils import timezone
from .models import PasswordResetOTP

@shared_task
def cleanup_expired_otps():
    """Deletes all OTPs older than 24 hours to keep the DB lean."""
    cutoff = timezone.now() - timezone.timedelta(days=1)
    deleted_count, _ = PasswordResetOTP.objects.filter(created_at__lt=cutoff).delete()
    return f"Deleted {deleted_count} old OTP records."