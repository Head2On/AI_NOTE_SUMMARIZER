from django.urls import re_path
from .consumers import NoteEditorConsumer

websocket_urlpatterns = [
    re_path(r"ws/notes/(?P<note_id>[^/]+)/$", NoteEditorConsumer.as_asgi()),
]
