#!/usr/bin/env bash
set -euo pipefail

echo "BUILD START"

# Pick whichever Python is available on the Vercel build image.
PY="$(command -v python3.12 || command -v python3.11 || command -v python3.10 || command -v python3.9 || command -v python3)"

PIP_FLAGS="--break-system-packages"

"$PY" -m pip install $PIP_FLAGS --upgrade pip
"$PY" -m pip install $PIP_FLAGS -r requirements.txt

# Collect all static into the dist directory Vercel will serve via its CDN.
DJANGO_SETTINGS_MODULE=config.settings "$PY" manage.py collectstatic --noinput --clear

echo "BUILD END"
