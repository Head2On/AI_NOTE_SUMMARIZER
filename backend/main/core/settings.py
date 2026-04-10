import json
from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv
import firebase_admin 
from firebase_admin import credentials, auth

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-dev-only')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework.authtoken',

    # local apps
    'accounts',
    'notes',
    'channels',
    'rest_framework_simplejwt.token_blacklist',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',

    # Add this line here
    'allauth.account.middleware.AccountMiddleware',

    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'Note-Summarizer'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'supersecretpassword'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT' : os.getenv('DB_PORT', '5432'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE':5,
    
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/minute',  # Strict limit for login/OTP attempts
        'user': '1000/day',
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # User must refresh every 30 mins
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # User must login again after 1 day
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

TESSERACT_PATH = os.getenv('TESSERACT_PATH', "tesseract")
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# CORS settings
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')

ASGI_APPLICATION = "core.asgi.application"


# core/settings.py

# This configures the connection to the Redis container
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            # 'redis' here matches the service name in docker-compose.yml
            "hosts": [(os.getenv('REDIS_HOST', 'redis'), 6379)],
        },
    },
}

# Celery Configuration Options
CELERY_BROKER_URL = f"redis://{os.getenv('REDIS_HOST', 'redis')}:6379/0"
CELERY_RESULT_BACKEND = f"redis://{os.getenv('REDIS_HOST', 'redis')}:6379/0"
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'



FIREBASE_KEY_PATH = BASE_DIR / 'firebase-service-account.json'

# Initialize only if an app hasn't been started yet (prevents errors on auto-reload)
firebase_config = os.getenv('FIREBASE_CONFIG_JSON')
if not firebase_admin._apps:
    if firebase_config:
        try:
            cred_dict = json.loads(firebase_config)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully from ENV.")
        except json.JSONDecodeError as e:
            print(f"Firebase ENV JSON is malformed: {e}") 
        except Exception as e:
            print(f"Error initializing Firebase from ENV: {e}")    
    else:
        # Fallback for local development if ENV is missing
        if FIREBASE_KEY_PATH.exists():
            cred = credentials.Certificate(str(FIREBASE_KEY_PATH))
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from local JSON file.")
        else:
            print("⚠️ WARNING: No Firebase credentials found in ENV or local file.")
 
# Modern dj-rest-auth configuration
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'ai-note-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'ai-note-refresh',
    'JWT_AUTH_HTTPONLY': True,
    'JWT_AUTH_SAMESITE': 'Lax', # Essential for modern browser security
    'JWT_AUTH_SECURE': not DEBUG, # Only send over HTTPS in production
}


ACCOUNT_USER_MODEL_USERNAME_FIELD = None # Tells Allauth your model has no username field


# Disable email verification for social accounts for now to keep it simple
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']


GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
print(f"DEBUG: API Key starts with: {GEMINI_API_KEY[:5]}...")