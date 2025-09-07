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
# Разрешаем CORS с credentials для фронтенда (Vite/Prod)
CORS(
    app,
    resources={r"/*": {"origins": [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Authorization"],
    methods=["GET", "POST", "OPTIONS", "DELETE"],
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
                password_hash TEXT NOT NULL,
                email TEXT
            )
            """
        )
        # Обновление старых БД: добавить столбец email, если его нет
        try:
            conn.execute("ALTER TABLE users ADD COLUMN email TEXT")
        except Exception:
            pass
        # Чаты пользователя
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                title TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        # Сообщения в чате
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(chat_id) REFERENCES chats(id)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _create_token(username: str, minutes: int | None = None, days: int | None = None, typ: str | None = None):
    now = datetime.datetime.utcnow()
    exp = now + (datetime.timedelta(minutes=minutes) if minutes else datetime.timedelta(days=days or 1))
    payload = {"sub": username, "iat": now, "exp": exp}
    if typ:
        payload["typ"] = typ
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def create_access_token(username: str) -> str:
    return _create_token(username, minutes=30, typ="access")


def create_refresh_token(username: str) -> str:
    return _create_token(username, days=14, typ="refresh")


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def set_session_cookies(response: Response, username: str) -> None:
    access = create_access_token(username)
    refresh = create_refresh_token(username)
    # В продакшене добавьте secure=True (требует HTTPS)
    response.set_cookie("access_token", access, httponly=True, samesite="Lax", path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, samesite="Lax", path="/")


def clear_session_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


@app.before_request
def _require_jwt_for_request_to_model():
    if request.endpoint == "request_to_model":
        # Разрешаем preflight без авторизации
        if request.method == "OPTIONS":
            return None
        auth_header = request.headers.get("Authorization", "")
        token = None
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
        else:
            token = request.cookies.get("access_token")
        if not token:
            return jsonify({"error": "Missing access token"}), 401
        try:
            decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401


def get_current_username() -> str | None:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None
    try:
        data = decode_token(token)
        return data.get("sub")
    except Exception:
        return None


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    email = (data.get("email") or "").strip()
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
    password_hash = generate_password_hash(password)
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT 1 FROM users WHERE username = ?", (username,))
        if cur.fetchone():
            return jsonify({"error": "user already exists"}), 409
        conn.execute(
            "INSERT INTO users(username, password_hash, email) VALUES(?, ?, ?)",
            (username, password_hash, email or None),
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
        # Устанавливаем httpOnly куки сессии и возвращаем краткий ответ
        resp = jsonify({"ok": True, "username": username})
        set_session_cookies(resp, username)
        return resp, 200
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
        chat_id = data.get("chat_id")
        if not user_text:
            return jsonify({"error": "request is required"}), 400
        # Сначала сохраняем пользовательское сообщение и заголовок чата (если пуст)
        username = get_current_username()
        saved_message = False
        if username and chat_id:
            try:
                conn = get_db_connection()
                cur = conn.execute("SELECT id FROM chats WHERE id = ? AND username = ?", (chat_id, username))
                row = cur.fetchone()
                if row:
                    now = datetime.datetime.utcnow().isoformat()
                    cur2 = conn.execute("SELECT title FROM chats WHERE id = ?", (chat_id,))
                    row2 = cur2.fetchone()
                    if row2 and (row2["title"] is None or (str(row2["title"]).strip() == "")):
                        first_title = (user_text or "").strip()
                        if len(first_title) > 80:
                            first_title = first_title[:80]
                        conn.execute("UPDATE chats SET title = ? WHERE id = ?", (first_title, chat_id))
                    conn.execute(
                        "INSERT INTO messages(chat_id, role, content, created_at) VALUES(?, ?, ?, ?)",
                        (chat_id, "user", user_text, now),
                    )
                    conn.commit()
                    saved_message = True
            finally:
                try:
                    conn.close()
                except Exception:
                    pass

        # Пытаемся получить ответ модели, но не падаем, если нет токена/ошибка
        try:
            answer = use_model(user_text)
        except Exception as exc:
            answer = "Извините, сейчас ответ недоступен. Попробуйте позже."

        # Сохраняем ответ ассистента, если сохранили сообщение и есть доступ к чату
        if username and chat_id and saved_message:
            try:
                conn = get_db_connection()
                now = datetime.datetime.utcnow().isoformat()
                conn.execute(
                    "INSERT INTO messages(chat_id, role, content, created_at) VALUES(?, ?, ?, ?)",
                    (chat_id, "assistant", answer, now),
                )
                conn.commit()
            finally:
                try:
                    conn.close()
                except Exception:
                    pass

        return jsonify({"answer": answer}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/auth/me", methods=["GET"]) 
def auth_me():
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"user": None}), 401
    try:
        data = decode_token(token)
        username = data.get("sub")
        # Получаем email из БД
        conn = get_db_connection()
        try:
            cur = conn.execute("SELECT email FROM users WHERE username = ?", (username,))
            row = cur.fetchone()
            email = row["email"] if row else None
        finally:
            conn.close()
        return jsonify({"user": {"username": username, "email": email}}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"user": None}), 401
    except jwt.InvalidTokenError:
        return jsonify({"user": None}), 401


@app.route("/auth/refresh", methods=["POST"]) 
def auth_refresh():
    token = request.cookies.get("refresh_token")
    if not token:
        return jsonify({"error": "no refresh"}), 401
    try:
        data = decode_token(token)
        if data.get("typ") != "refresh":
            return jsonify({"error": "bad token"}), 401
        username = data.get("sub")
        resp = jsonify({"ok": True})
        set_session_cookies(resp, username)
        return resp, 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "refresh expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "invalid refresh"}), 401


@app.route("/auth/logout", methods=["POST"]) 
def auth_logout():
    resp = jsonify({"ok": True})
    clear_session_cookies(resp)
    return resp, 200


# ------- Чаты и сообщения -------

@app.route("/chats", methods=["GET", "OPTIONS"])  
def list_chats():
    if request.method == "OPTIONS":
        return "", 204
    username = get_current_username()
    if not username:
        return jsonify({"error": "unauthorized"}), 401
    conn = get_db_connection()
    try:
        cur = conn.execute(
            "SELECT id, title, created_at FROM chats WHERE username = ? ORDER BY id DESC",
            (username,),
        )
        chats = [dict(row) for row in cur.fetchall()]
        return jsonify({"chats": chats})
    finally:
        conn.close()


@app.route("/chats", methods=["POST", "OPTIONS"])  
def create_chat():
    if request.method == "OPTIONS":
        return "", 204
    username = get_current_username()
    if not username:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    # Не задаём финальный заголовок сразу — установим его по первому сообщению
    title = (data.get("title") or "").strip()
    now = datetime.datetime.utcnow().isoformat()
    conn = get_db_connection()
    try:
        cur = conn.execute(
            "INSERT INTO chats(username, title, created_at) VALUES(?, ?, ?)",
            (username, title or None, now),
        )
        chat_id = cur.lastrowid
        conn.commit()
        return jsonify({"id": chat_id, "title": title}), 201
    finally:
        conn.close()


@app.route("/chats/<int:chat_id>", methods=["GET", "OPTIONS"])  
def get_chat(chat_id: int):
    if request.method == "OPTIONS":
        return "", 204
    username = get_current_username()
    if not username:
        return jsonify({"error": "unauthorized"}), 401
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT id, title, created_at, username FROM chats WHERE id = ?", (chat_id,))
        chat = cur.fetchone()
        if not chat or chat["username"] != username:
            return jsonify({"error": "not found"}), 404
        cur2 = conn.execute(
            "SELECT id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY id ASC",
            (chat_id,),
        )
        messages = [dict(row) for row in cur2.fetchall()]
        return jsonify({"chat": {"id": chat_id, "title": chat["title"], "created_at": chat["created_at"]}, "messages": messages})
    finally:
        conn.close()


@app.route("/chats/<int:chat_id>/messages", methods=["POST", "OPTIONS"])  
def add_message(chat_id: int):
    if request.method == "OPTIONS":
        return "", 204
    username = get_current_username()
    if not username:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    role = (data.get("role") or "user").strip()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT id FROM chats WHERE id = ? AND username = ?", (chat_id, username))
        if not cur.fetchone():
            return jsonify({"error": "not found"}), 404
        now = datetime.datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO messages(chat_id, role, content, created_at) VALUES(?, ?, ?, ?)",
            (chat_id, role, content, now),
        )
        conn.commit()
        return jsonify({"ok": True}), 201
    finally:
        conn.close()


@app.route("/chats/<int:chat_id>", methods=["DELETE", "OPTIONS"])  
def delete_chat(chat_id: int):
    if request.method == "OPTIONS":
        return "", 204
    username = get_current_username()
    if not username:
        return jsonify({"error": "unauthorized"}), 401
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT id FROM chats WHERE id = ? AND username = ?", (chat_id, username))
        if not cur.fetchone():
            return jsonify({"error": "not found"}), 404
        conn.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
        conn.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        conn.commit()
        return jsonify({"ok": True}), 200
    finally:
        conn.close()


def main():
    init_db()
    app.run(port=8070)


if __name__ == "__main__":
    main()
