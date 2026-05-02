# import json
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
from DB import dbuser, dbcities, dbachievements


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


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(lifespan=lifespan)


@app.get("/api/generateotp")
async def generate_otp():
    global OTP
    OTP = random.randint(100000, 999999)
    await bot.send_message(chat_id=TG_CHAT, text=f"OTP: {OTP}")


@app.get("/api/me", dependencies=[Depends(require_auth)])
async def me():
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
    return await dbcities.found_player_all_cities(player_id)


@app.get("/api/player/achievements")
async def player_achievements(player_id: int):
    return await dbachievements.get_player_achievements(player_id)


@app.get("/api/city")
async def city(city_id: str):
    return await dbcities.found_city(city_id)


@app.get("/api/all_cities")
async def all_cities():
    return await dbcities.all_cities()


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
    return {"ok": True}


@app.get("/api/achievements")
async def get_achievements():
    return await dbachievements.get_achievements()


@app.get("/api/achievements/{player_id}")
async def get_achievements_from_player(player_id: int):
    return await dbachievements.get_achievements(player_id, True)


@app.post("/api/achievements", dependencies=[Depends(require_auth)])
async def insert_achievement(achievement: dict):
    return await dbachievements.insert_achievement(achievement)


@app.delete("/api/achievements/{ach_key}", dependencies=[Depends(require_auth)])
async def delete_achievement(ach_key: str):
    return await dbachievements.delete_achievement(ach_key)


@app.put("/api/achievements/{ach_key}", dependencies=[Depends(require_auth)])
async def update_achievement(ach_key: str, achievement: dict):
    return await dbachievements.update_achievement(ach_key, achievement)


@app.get("/api/getranked")
async def get_ranked():
    return await dbuser.get_ranked()


@app.patch("/api/user/{chat_id}/public_name")
async def update_public_name(chat_id: int, args: dict):
    name = args.get("public_name")
    return await dbuser.add_public_name(chat_id, name)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://sardiniapueblo.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, port=5001, host="0.0.0.0")
