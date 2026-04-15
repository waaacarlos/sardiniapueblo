import json
import os
import random
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from fastapi.middleware.cors import CORSMiddleware

from telegram import Bot

from DB.dbservice import init_db, close_db
from DB import dbuser, dbcities


load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACHIEVEMENTS_PATH = Path(__file__).parent / "Resources" / "achievements.json"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
TG_CHAT = os.getenv("ADMIN_CHAT_ID")
bot = Bot(token=os.getenv("TELEGRAM_TOKEN"))

bearer = HTTPBearer()

OTP = None


def require_auth(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token not valid")


def create_token() -> str:
    payload = {
        "sub": "admin",
        "exp": datetime.now() + timedelta(hours=8)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def load_achievements():
    return json.loads(ACHIEVEMENTS_PATH.read_text(encoding="utf-8"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()  # inizializza pool asyncpg all'avvio
    yield
    await close_db()  # chiude pool allo spegnimento


app = FastAPI(lifespan=lifespan)


@app.get("/api/generateotp")
async def generate_otp():
    global OTP
    OTP = random.randint(100000, 999999)
    await bot.send_message(chat_id=TG_CHAT, text=f"OTP: {OTP}")


@app.get("/api/me")
async def me(auth=Depends(require_auth)):
    return {"authenticated": True}


@app.get("/api/player")
async def player(player_id: int):
    player_info = await dbuser.get_user_details(player_id)
    if player_info:
        return player_info
    else:
        raise HTTPException(status_code=404, detail="Player not found")


@app.get("/api/player/cities")
async def player_points(player_id: int):
    return await dbcities.found_player_cities(player_id)


@app.get("/api/city")
async def city(city_id: str):
    return await dbcities.found_city(city_id)


@app.post("/api/login")
async def login(body: dict):
    if not OTP:
        raise HTTPException(status_code=400, detail="OTP not generated yet.")
    if body.get("password") != str(OTP):
        raise HTTPException(status_code=401, detail="Wrong creds")
    token = create_token()
    return {"token": token}


@app.post("/api/logout")
async def logout():
    return {"ok": True}  # il frontend eliminerà il token


@app.get("/api/achievements")
async def get_achievements(auth=Depends(require_auth)):
    return list(load_achievements().values())


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # il tuo frontend Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, port=5001)

'''
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from functools import wraps

from flask import Flask, request, jsonify, session
from flask_cors import CORS

load_dotenv()


app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
CORS(app, supports_credentials=True)

ACHIEVEMENTS_PATH = Path(__file__).parent.parent / "Resources" / "achievements.json"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")


def load_achievements():
    return json.loads(ACHIEVEMENTS_PATH.read_text(encoding="utf-8"))


def save_achievements(data):
    ACHIEVEMENTS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("authenticated"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


@app.route("/api/login", methods=["POST"])
def login():
    body = request.get_json()
    if body.get("password") == ADMIN_PASSWORD:
        session["authenticated"] = True
        return jsonify({"ok": True})
    return jsonify({"error": "Password errata"}), 401


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def me():
    return jsonify({"authenticated": session.get("authenticated", False)})


@app.route("/api/achievements", methods=["GET"])
@require_auth
def get_achievements():
    return jsonify(list(load_achievements().values()))


@app.route("/api/achievements", methods=["POST"])
@require_auth
def create_achievement():
    body = request.get_json()
    key = body.get("key")
    if not key:
        return jsonify({"error": "key mancante"}), 400

    data = load_achievements()
    if key in data:
        return jsonify({"error": "Achievement già esistente"}), 409

    data[key] = build_achievement(body)
    save_achievements(data)
    return jsonify({"ok": True, "key": key}), 201


@app.route("/api/achievements/<key>", methods=["PUT"])
@require_auth
def update_achievement(key):
    body = request.get_json()
    data = load_achievements()
    if key not in data:
        return jsonify({"error": "Achievement non trovato"}), 404

    data[key] = build_achievement(body)
    save_achievements(data)
    return jsonify({"ok": True})


@app.route("/api/achievements/<key>", methods=["DELETE"])
@require_auth
def delete_achievement(key):
    data = load_achievements()
    if key not in data:
        return jsonify({"error": "Achievement non trovato"}), 404

    del data[key]
    save_achievements(data)
    return jsonify({"ok": True})


def build_achievement(body):
    category = body.get("category")
    ach = {
        "title": body.get("title"),
        "description": body.get("description"),
        "category": category,
    }
    if category == "progress":
        ach["threshold"] = int(body.get("threshold"))
    elif category == "city":
        raw = body.get("cities", "")
        ach["cities"] = [c.strip() for c in raw.split("\n") if c.strip()]
    elif category == "city_province":
        ach["province"] = body.get("province")
    elif category == "write":
        ach["event"] = body.get("event")
    return ach


if __name__ == "__main__":
    app.run(debug=True, port=5001)
'''
