# BornAgain OS V2

Desktop-style Django site with a Windows 98/XP inspired interface, draggable windows + icons, HTMX-loaded game modules, dark CRT atmosphere with intermittent glitches.

## Stack

- Django 4.2
- Django templates · HTMX · Alpine.js
- Vanilla JS + CSS (no build step)
- SQLite (read-only at runtime, app does not write to DB)

## Structure

```text
apps/
  core/          accounts/      desktop/
  games/
    file_hunt/   flappy_bat/   memory_cards/
    antivirus/   cmd_game/     explorer_maze/
config/
  settings.py   urls.py   wsgi.py
templates/
  base.html
  desktop/{components,windows}/
  games/{file_hunt,flappy_bat,memory_cards,antivirus,cmd_game,explorer_maze}/
static/
  css/   js/{desktop,games}/   img/{icons,memes,pixel,memory,assets}/   audio/music/
build_files.sh   vercel.json   .gitignore   .vercelignore
```

## Implemented

- Cold-industrial dark theme (steel grey + cyan-blue accents) with CRT scanlines, sweep, vignette, periodic screen-tear / chromatic / icon shudder glitches.
- Window manager: focus, z-index, drag, minimize/maximize/close, opening transitions.
- Draggable desktop icons; positions persisted in `localStorage`.
- HTMX-loaded games. Booted modules: `file_hunt`, `flappy_bat`, `memory_cards`, `antivirus`, `explorer_maze`, `cmd_game`, paint-puzzle (template-only), music-player (template-only).
- Antivirus mini-game with scanning + quarantine workflow (RU).
- Explorer Maze — nested-folder labyrinth with traps + exit (RU).
- CMD prompt — 4 commands: `help`, `date`, `goodtoseeyou`, `needtogowiththeflow`.
- Paint puzzle — 12×12 pixel restoration with 3 target sprites.
- Music player — 4 tracks from `static/audio/music/`, progress + volume + tracklist.
- Random tense system popups + occasional jitter from the window manager.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate            # creates db.sqlite3 if missing
python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

## Deploy to Vercel

Push the repo to GitHub, then import it into Vercel. The included `vercel.json` and `build_files.sh` set up:

- `@vercel/python` runtime targets `config/wsgi.py` (which exports `application` and `app`).
- `@vercel/static-build` runs `build_files.sh` → `pip install -r requirements.txt` + `manage.py collectstatic` into `staticfiles_build/static/`. Vercel's CDN serves the result at `/static/*`.
- Routes: `/static/*` → CDN, everything else → WSGI lambda.

### Required environment variables on Vercel

| Variable | Suggested value | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | a long random string | Replace the dev key in `config/settings.py`. |
| `DJANGO_DEBUG` | `0` | Disable debug in production. |
| `DJANGO_ALLOWED_HOSTS` | `<your-project>.vercel.app,.vercel.app` | Comma-separated allowed hosts. |

The settings already default to safe values, but set these explicitly in Vercel's project dashboard.

### Notes
- SQLite is shipped read-only; on Vercel the DB path is redirected to `/tmp/db.sqlite3` to allow the SQLite engine to open. No real DB writes happen at runtime.
- `Прошлый сайт/` (legacy reference assets) is excluded from git + Vercel deploys via `.gitignore` / `.vercelignore`.
- Music + image assets total ≈ 43 MB. They're served from Vercel's CDN, not bundled into the lambda, so the function stays small.

## Tips while playing

- Hover the desktop ~30s after boot — ambient system popups start appearing in random places.
- Right-click is not used. Single click selects an icon, double-click opens.
- Icons can be dragged anywhere on the desktop; the layout is remembered between sessions.
- The trash file `definitely_not_final.exe` glitches the whole screen.
