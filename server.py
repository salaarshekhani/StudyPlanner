from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import os
import hashlib
import uuid
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = BASE_DIR
DB_PATH = os.path.join(PROJECT_DIR, 'users.db')


def make_default_state():
    return {
        'subjects': [],
        'completedSessions': {},
        'pomodoroLog': {},
        'todos': {},
        'weekOffset': 0,
        'selectedSubject': None,
        'pomoConfig': {'focus': 25, 'short': 5, 'long': 15},
        'sessionHistory': [],
        'currentStreak': 0,
        'longestStreak': 0,
        'lastSessionDate': None
    }

app = Flask(__name__, static_folder=PROJECT_DIR, template_folder=PROJECT_DIR)


def init_db():
    os.makedirs(PROJECT_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        'CREATE TABLE IF NOT EXISTS users ('
        'username TEXT PRIMARY KEY, '
        'password TEXT NOT NULL, '
        'state TEXT NOT NULL DEFAULT "{}", '
        'token TEXT'
        ')'
    )
    conn.commit()
    cursor = conn.execute('PRAGMA table_info(users)')
    columns = [row[1] for row in cursor.fetchall()]
    if 'token' not in columns:
        conn.execute('ALTER TABLE users ADD COLUMN token TEXT')
        conn.commit()
    if 'state' not in columns:
        conn.execute('ALTER TABLE users ADD COLUMN state TEXT NOT NULL DEFAULT "{}"')
        conn.commit()
    conn.close()

init_db()


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def parse_auth_request():
    data = request.get_json(silent=True)
    if data is None:
        data = request.form.to_dict() or request.values.to_dict()
    if not isinstance(data, dict):
        data = {}
    return data


def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def create_token():
    return uuid.uuid4().hex


def validate_token(username, token):
    if not username or not token:
        return False
    conn = get_db_connection()
    row = conn.execute(
        'SELECT token FROM users WHERE username = ?',
        (username,)
    ).fetchone()
    conn.close()
    return row is not None and row['token'] == token


@app.route('/')
def index():
    return send_from_directory(PROJECT_DIR, 'index.html')


@app.route('/<path:path>')
def static_file(path):
    return send_from_directory(PROJECT_DIR, path)


@app.route('/api/register', methods=['POST'])
def register():
    data = parse_auth_request()
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify(ok=False, msg='missing_username_or_password'), 400

    hashed = hash_password(password)
    token = create_token()
    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO users (username, password, state, token) VALUES (?, ?, ?, ?)',
            (username, hashed, json.dumps(make_default_state()), token)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify(ok=False, msg='username_taken'), 409
    conn.close()
    return jsonify(ok=True, token=token, state=make_default_state())


@app.route('/api/login', methods=['POST'])
def login():
    data = parse_auth_request()
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify(ok=False, msg='missing_username_or_password'), 400

    conn = get_db_connection()
    row = conn.execute(
        'SELECT password, state, token FROM users WHERE username = ?',
        (username,)
    ).fetchone()
    conn.close()

    if row is None or row['password'] != hash_password(password):
        return jsonify(ok=False, msg='invalid_credentials'), 401

    state = json.loads(row['state'] or '{}')
    token = row['token'] or create_token()

    if row['token'] is None:
        conn = get_db_connection()
        conn.execute('UPDATE users SET token = ? WHERE username = ?', (token, username))
        conn.commit()
        conn.close()

    return jsonify(ok=True, token=token, state=state)


@app.route('/api/save-state', methods=['POST'])
def save_state():
    data = parse_auth_request()
    username = request.headers.get('X-User') or data.get('username')
    token = request.headers.get('X-Auth-Token') or data.get('token')
    state = data.get('state')

    if not username or not token:
        return jsonify(ok=False, msg='missing_auth'), 401

    if not validate_token(username, token):
        return jsonify(ok=False, msg='invalid_token'), 403

    try:
        state_json = json.dumps(state or {})
    except (TypeError, ValueError):
        return jsonify(ok=False, msg='invalid_state'), 400

    conn = get_db_connection()
    conn.execute('UPDATE users SET state = ? WHERE username = ?', (state_json, username))
    conn.commit()
    conn.close()
    return jsonify(ok=True)


@app.route('/api/state', methods=['GET'])
def state():
    username = request.headers.get('X-User')
    token = request.headers.get('X-Auth-Token')

    if not username or not token:
        return jsonify(ok=False, msg='missing_auth'), 401

    if not validate_token(username, token):
        return jsonify(ok=False, msg='invalid_token'), 403

    conn = get_db_connection()
    row = conn.execute('SELECT state FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    if row is None:
        return jsonify(ok=False, msg='invalid_user'), 404

    state = json.loads(row['state'] or '{}')
    return jsonify(ok=True, state=state)


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
