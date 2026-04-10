"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

# 1. Set settings FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 2. Initialize Django NOW
# This tells Django to wake up and load all your apps/models.
django_asgi_app = get_asgi_application()

# 3. NOW it is safe to import your app routing
# (If you did this at the top, it would crash)
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import notes.routing

application = ProtocolTypeRouter({
    # 4. Use the initialized Django app for HTTP
    "http": django_asgi_app,

    # WebSocket handler
    "websocket": AuthMiddlewareStack(
        URLRouter(
            notes.routing.websocket_urlpatterns
        )
    ),
})