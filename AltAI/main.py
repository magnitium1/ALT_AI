from flask import *
from flask_cors import CORS
from model import use_model
import os
import datetime
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import sqlite3


app = Flask(__name__)
# Разрешаем CORS с заголовком Authorization и методом OPTIONS
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=False,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-prod")
DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def create_token(username):
    payload = {
        "sub": username,
        
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@app.before_request
def _require_jwt_for_request_to_model():
    if request.endpoint == "request_to_model":
        # Разрешаем preflight без авторизации
        if request.method == "OPTIONS":
            return None
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split(" ", 1)[1].strip()
        try:
            jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
    password_hash = generate_password_hash(password)
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT 1 FROM users WHERE username = ?", (username,))
        if cur.fetchone():
            return jsonify({"error": "user already exists"}), 409
        conn.execute(
            "INSERT INTO users(username, password_hash) VALUES(?, ?)",
            (username, password_hash),
        )
        conn.commit()
        return jsonify({"message": "registered"}), 201
    finally:
        conn.close()


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
    conn = get_db_connection()
    try:
        cur = conn.execute(
            "SELECT password_hash FROM users WHERE username = ?",
            (username,),
        )
        row = cur.fetchone()
        if not row or not check_password_hash(row["password_hash"], password):
            return jsonify({"error": "invalid credentials"}), 401
        token = create_token(username)
        return jsonify({"token": token}), 200
    finally:
        conn.close()


@app.route("/request_to_model", methods=["POST", "OPTIONS"])
def request_to_model():
    # Корректно отвечаем на preflight
    if request.method == "OPTIONS":
        return "", 204
    try:
        data = request.get_json(silent=True) or {}
        user_text = data.get("request", "")
        if not user_text:
            return jsonify({"error": "request is required"}), 400
        answer = use_model(user_text)
        return jsonify({"answer": answer}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


def main():
    init_db()
    app.run(port=8070)


if __name__ == "__main__":
    main()
