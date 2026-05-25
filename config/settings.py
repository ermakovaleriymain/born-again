"""
Django settings for config project.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Secrets & flags (env-driven for production) -----------------------------

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-!y)p6g&vlkt(-5@qfim#9udf!--o*6s2o@zju4trgrzk@wf46p',
)

DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'

# Comma-separated list, e.g. "myapp.vercel.app,.vercel.app".
# Always allow localhost + Vercel preview/prod by default.
_default_hosts = '127.0.0.1,localhost,.vercel.app,.now.sh'
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('DJANGO_ALLOWED_HOSTS', _default_hosts).split(',') if h.strip()]

CSRF_TRUSTED_ORIGINS = [
    'https://*.vercel.app',
    'https://*.now.sh',
]

# --- Application definition --------------------------------------------------

INSTALLED_APPS = [
    'apps.core',
    'apps.desktop',
    'apps.games.file_hunt',
    'apps.games.flappy_bat',
    'apps.games.memory_cards',
    'apps.games.antivirus',
    'apps.games.cmd_game',
    'apps.games.explorer_maze',
    'apps.accounts',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- Database ----------------------------------------------------------------
# Vercel serverless filesystems are read-only outside /tmp. This site doesn't
# write to the DB (no auth, no sessions stored long-term), so SQLite bundled
# in the repo is sufficient. If a write ever happens at runtime, redirect it
# to /tmp where Vercel allows ephemeral writes.

_bundled_sqlite = BASE_DIR / 'db.sqlite3'
if os.environ.get('VERCEL'):
    import shutil
    _runtime_sqlite = Path('/tmp') / 'db.sqlite3'
    if _bundled_sqlite.exists() and not _runtime_sqlite.exists():
        try:
            shutil.copy(str(_bundled_sqlite), str(_runtime_sqlite))
        except OSError:
            pass
else:
    _runtime_sqlite = _bundled_sqlite

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(_runtime_sqlite),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Localisation ------------------------------------------------------------

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

# --- Static files ------------------------------------------------------------
# Source: ./static/   (committed to repo)
# Collected to:       ./staticfiles_build/static/  (built by Vercel, served by CDN)

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles_build' / 'static'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
