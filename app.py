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

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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


FRONTEND_DIST = Path(__file__).parent / "webapp/frontend/dist"
app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse(FRONTEND_DIST / "index.html")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://sardiniapueblo.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, port=5001, host="0.0.0.0")
