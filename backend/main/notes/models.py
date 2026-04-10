from django.db import models 
from accounts.models import User
import uuid
from django.utils.crypto import get_random_string

def note_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return f'notes/{instance.user.id}/{filename}'

class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=225, blank =True)
    file = models.FileField(upload_to=note_upload_path, null=True, blank=True)
    extracted_text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)   
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    category = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)   # list of strings
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=50, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)

    file_origin = models.FileField(upload_to='notes/originals/', null=True, blank=True)
    status = models.CharField(max_length=20,
        choices=[('PENDING', 'Pending'), ('PROCESSING', 'Processing'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')],
        default='PENDING'
    )
    #Add this to store the "key Takeaways" or different version
    summary_type = models.CharField(max_length=50, default='general')
    

    def generate_share_token(self):
        self.share_token = get_random_string(32)
        self.is_public = True
        self.save()

    def __str__(self):
        return self.title or f"Note {self.id}"


class SharedNote(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="shared_to")
    shared_with = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    shared_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('note', 'shared_with')  # prevent duplicates

    def __str__(self):
        return f"{self.note.title} → {self.shared_with.email}"


class NoteVersion(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="versions")
    title = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list)
    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Version of {self.id} of {self.note.id} at {self.created_at}"
