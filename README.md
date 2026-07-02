<a name="top"></a>
[![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0%2B-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Database](https://img.shields.io/badge/database-SQLite-003B57?logo=sqlite&logoColor=white)](#project-structure)
[![Frontend](https://img.shields.io/badge/frontend-HTML%2FCSS%2FJS-E34F26?logo=html5&logoColor=white)](#project-structure)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Status](https://img.shields.io/badge/status-active_development-brightgreen)](#whats-new)

## Table of Contents
- [About](#about)
- [What's New](#whats-new)
- [Features](#features)
- [How to Install](#how-to-install)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Roadmap](#roadmap)
- [Feedback and Contributions](#feedback-and-contributions)
- [License](#license)
- [Contacts](#contacts)

## About

StudyPlanner is a cross-device, browser-based productivity tool built for students to manage their academic workload in one place. It combines subject tracking, a weekly timetable, a to-do list, exam and reminder scheduling, and a Pomodoro-style focus timer behind a single lightweight Flask backend, with account sync so a student's state follows them across devices.

The project is intentionally minimal in its dependency footprint. A single-file Flask server backed by SQLite handles authentication and state persistence, while the frontend is plain HTML, CSS, and vanilla JavaScript with no build step or framework required. This keeps the whole application easy to run locally, easy to read end to end, and easy to extend.

## What's New

### Current Version

Features:
- Token-based account system with per-user state persisted server-side in SQLite
- Automatic local and remote state merging on login, so progress made while logged out is not lost
- Streak tracking (current and longest) computed from Pomodoro session history
- Light and dark theme toggle with persisted preference via `localStorage`
- Lightweight celebratory effects layer (confetti and canvas) for completed sessions

Improvements:
- Auth requests centralized through a single `apiRequest` helper in `auth.js` with consistent error shapes (`ok`, `msg`)
- Server-side schema migration guards (`ALTER TABLE ... ADD COLUMN`) so the SQLite schema self-heals on startup for older `users.db` files

## Features

| Page | Purpose |
|:-|:-|
| `index.html` (Overview) | Dashboard summarizing subjects, progress, and streaks |
| `subjects.html` (Subjects) | Add, edit, and track study subjects |
| `timetable.html` (Timetable) | Weekly schedule view with week navigation (`weekOffset`) |
| `todo.html` (To-Do) | Task management scoped by subject |
| `pomodoro.html` (Pomodoro Timer) | Configurable focus, short-break, and long-break timer with session logging |
| `account.html` (Account) | Registration, login, and sync controls |
| `about.html` (About) | Project information page |

Cross-cutting capabilities shared across pages:
- Persistent state: a single JSON state object (subjects, todos, completed sessions, Pomodoro log, streaks, week offset) shared across every page via `state.js`
- Cloud sync: state pushed to `/api/save-state` and pulled via `/api/state` whenever a user is authenticated, keyed by a bearer-style `X-User` and `X-Auth-Token` header pair
- Offline-friendly fallback: state also persists to `localStorage` so the app remains usable without an account
- Theming: a single `data-theme` attribute driven by `theme-toggle.js`

## How to Install

```shell
# Clone the repository
git clone https://github.com/<your-username>/StudyPlanner.git
cd StudyPlanner

# Install the Python dependency
pip install -r requirements.txt

# Run the server
python server.py
```

The server starts on `http://0.0.0.0:5000` in debug mode and initializes `users.db` automatically on first run. Open `http://localhost:5000` in a browser to load the Overview page.

No frontend build step is required. `index.html`, `style.css`, and the `.js` files are served directly by Flask via `send_from_directory`.

## Project Structure

```
StudyPlanner/
├── server.py            # Flask app: routing, auth, state persistence
├── requirements.txt      # Python dependencies (Flask)
├── users.db              # SQLite database (auto-created and migrated on startup)
├── state.js              # Shared client-side state model, streak calculation, date helpers
├── auth.js               # Client-side auth flow (register/login, token storage, state merge)
├── effects.js             # Visual celebration effects (confetti canvas)
├── theme-toggle.js        # Light/dark theme persistence and toggle button wiring
├── style.css              # Global styling
├── index.html             # Overview / dashboard
├── subjects.html          # Subject management
├── timetable.html         # Weekly timetable
├── todo.html               # To-do list
├── pomodoro.html           # Pomodoro timer
├── account.html            # Registration, login, and sync
└── about.html               # About page
```

## API Reference

All endpoints are served by `server.py`. Authenticated endpoints expect the `X-User` and `X-Auth-Token` headers, set automatically by `auth.js` once a user is logged in.

| Method | Endpoint | Auth required | Description |
|:-|:-|:-|:-|
| `POST` | `/api/register` | No | Creates a user with a hashed password (SHA-256) and default state; returns a bearer token |
| `POST` | `/api/login` | No | Validates credentials; returns the stored token and the user's saved state |
| `POST` | `/api/save-state` | Yes | Overwrites the authenticated user's saved state with the provided JSON payload |
| `GET`  | `/api/state` | Yes | Returns the authenticated user's currently saved state |
| `GET`  | `/`, `/<path:path>` | No | Serves the static frontend files |

Error responses follow a consistent shape: `{ "ok": false, "msg": "<reason>" }`, with reasons such as `missing_username_or_password`, `username_taken`, `invalid_credentials`, `missing_auth`, and `invalid_token`.

## Data Model

Each user's `state` column stores a single JSON document with this default shape (see `make_default_state()` in `server.py` and `makeDefaultState()` in `state.js`, which are kept in sync):

```json
{
  "subjects": [],
  "completedSessions": {},
  "pomodoroLog": {},
  "todos": {},
  "weekOffset": 0,
  "selectedSubject": null,
  "pomoConfig": { "focus": 25, "short": 5, "long": 15 },
  "sessionHistory": [],
  "currentStreak": 0,
  "longestStreak": 0,
  "lastSessionDate": null
}
```

Passwords are stored as SHA-256 hashes. For production use beyond local or personal deployment, migrating to a salted algorithm such as bcrypt or argon2 is recommended.

## Roadmap

- [ ] Salted password hashing (bcrypt or argon2) in place of plain SHA-256
- [ ] Exam and reminder scheduling surfaced as its own dedicated view
- [ ] Session history visualization (charts for streaks and focus time)
- [ ] Export and import of state as a portable JSON backup

## Feedback and Contributions

This is a personal school productivity project, actively evolving alongside real day-to-day use made for #horizons. Bug reports, feature ideas, and pull requests are welcome. Feel free to open an issue or fork the repository and submit changes.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](LICENSE) for the full text.

## Contacts

For questions about StudyPlanner, feel free to open an issue on the repository or reach out directly.

[Back to top](#top)
