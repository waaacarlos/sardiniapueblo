# import json
import os
import random
from datetime import datetime, timedelta, timezone
from typing import TypedDict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from contextlib import asynccontextmanager

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from fastapi.middleware.cors import CORSMiddleware

from telegram import Bot
from telegram.constants import ParseMode

from DB.dbservice import init_db, close_db
from DB import dbuser, dbcities, dbachievements


load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
TG_CHAT = os.getenv("ADMIN_CHAT_ID")
LOG_CHAT = os.getenv("LOG_CHAT_ID")
bot = Bot(token=os.getenv("TELEGRAM_TOKEN"))

bearer = HTTPBearer()

OTP_TTL_SECONDS = 300
OTP_MAX_FAILED_ATTEMPTS = 5
OTP_LOCK_SECONDS = 300

RATE_LIMIT_GENERATEOTP_MAX = 3
RATE_LIMIT_GENERATEOTP_WINDOW_SECONDS = 60
RATE_LIMIT_LOGIN_MAX = 10
RATE_LIMIT_LOGIN_WINDOW_SECONDS = 60
RATE_LIMIT_LOG_MAX = 20
RATE_LIMIT_LOG_WINDOW_SECONDS = 60


class OtpState(TypedDict):
    otp: str | None
    expires_at: datetime | None
    failed_attempts: int
    locked_until: datetime | None


OTP_STATE: OtpState = {
    "otp": None,
    "expires_at": None,
    "failed_attempts": 0,
    "locked_until": None,
}

RATE_LIMIT_STATE: dict[str, list[datetime]] = {}

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173"
]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def reset_otp_state() -> None:
    OTP_STATE["otp"] = None
    OTP_STATE["expires_at"] = None
    OTP_STATE["failed_attempts"] = 0


def is_otp_locked() -> bool:
    locked_until = OTP_STATE["locked_until"]
    if not locked_until:
        return False
    if utcnow() < locked_until:
        return True
    OTP_STATE["locked_until"] = None
    return False


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request, scope: str, max_requests: int, window_seconds: int) -> None:
    now = utcnow()
    key = f"{scope}:{_client_ip(request)}"
    entries = RATE_LIMIT_STATE.get(key, [])
    window_start = now - timedelta(seconds=window_seconds)
    entries = [t for t in entries if t >= window_start]

    if len(entries) >= max_requests:
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")

    entries.append(now)
    RATE_LIMIT_STATE[key] = entries


def get_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    if not raw.strip():
        return DEFAULT_ALLOWED_ORIGINS

    origins = [o.strip().strip('"').strip("'") for o in raw.split(",")]
    origins = [o for o in origins if o]
    return origins or DEFAULT_ALLOWED_ORIGINS


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


@app.post("/sardiniapueblo/api/log")
async def send_log(body: dict, request: Request):
    enforce_rate_limit(
        request,
        scope="log",
        max_requests=RATE_LIMIT_LOG_MAX,
        window_seconds=RATE_LIMIT_LOG_WINDOW_SECONDS,
    )
    message = str(body.get("message", "")).strip()
    if not message:
        message = "Webapp aperta"

    # Keep this endpoint public but constrained to simple page-open events.
    if not message.lower().startswith("webapp aperta"):
        raise HTTPException(status_code=400, detail="Unsupported log message")

    message = message.replace("\n", " ").replace("\r", " ")[:220]
    await bot.send_message(chat_id=LOG_CHAT, text=message)


@app.get("/sardiniapueblo/api/generateotp")
async def generate_otp(request: Request):
    enforce_rate_limit(
        request,
        scope="generateotp",
        max_requests=RATE_LIMIT_GENERATEOTP_MAX,
        window_seconds=RATE_LIMIT_GENERATEOTP_WINDOW_SECONDS,
    )

    if is_otp_locked():
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    otp = random.randint(1000, 9999)
    OTP_STATE["otp"] = str(otp)
    OTP_STATE["expires_at"] = utcnow() + timedelta(seconds=OTP_TTL_SECONDS)
    OTP_STATE["failed_attempts"] = 0
    await bot.send_message(chat_id=TG_CHAT, text=f"OTP: <code>{otp}</code>", parse_mode=ParseMode.HTML)
    return {"ok": True}


@app.get("/sardiniapueblo/api/me", dependencies=[Depends(require_auth)])
async def me():
    return {"authenticated": True}


@app.get("/sardiniapueblo/api/player")
async def player(player_id: int):
    player_info = await dbuser.get_user_details(player_id)
    if player_info:
        return player_info
    else:
        raise HTTPException(status_code=404, detail="Player not found")


@app.get("/sardiniapueblo/api/player/cities")
async def player_points(player_id: int):
    return await dbcities.found_player_all_cities(player_id)


@app.get("/sardiniapueblo/api/player/achievements")
async def player_achievements(player_id: int):
    return await dbachievements.get_player_achievements(player_id)


@app.get("/sardiniapueblo/api/city")
async def city(city_id: str):
    return await dbcities.found_city(city_id)


@app.get("/sardiniapueblo/api/all_cities")
async def all_cities():
    return await dbcities.all_cities()


@app.post("/sardiniapueblo/api/login")
async def login(body: dict, request: Request):
    enforce_rate_limit(
        request,
        scope="login",
        max_requests=RATE_LIMIT_LOGIN_MAX,
        window_seconds=RATE_LIMIT_LOGIN_WINDOW_SECONDS,
    )

    if is_otp_locked():
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    otp = OTP_STATE["otp"]
    expires_at = OTP_STATE["expires_at"]
    if not otp or not expires_at:
        raise HTTPException(status_code=400, detail="OTP not generated yet.")

    if utcnow() > expires_at:
        reset_otp_state()
        raise HTTPException(status_code=401, detail="OTP expired")

    password = body.get("password")
    if password is None:
        raise HTTPException(status_code=400, detail="Missing password")

    if password != otp:
        OTP_STATE["failed_attempts"] += 1
        if OTP_STATE["failed_attempts"] >= OTP_MAX_FAILED_ATTEMPTS:
            OTP_STATE["locked_until"] = utcnow() + timedelta(seconds=OTP_LOCK_SECONDS)
            reset_otp_state()
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
        raise HTTPException(status_code=401, detail="Wrong creds")

    token = create_token()
    reset_otp_state()
    return {"token": token}


@app.post("/sardiniapueblo/api/logout")
async def logout():
    reset_otp_state()
    return {"ok": True}


@app.get("/sardiniapueblo/api/achievements")
async def get_achievements():
    return await dbachievements.get_achievements()


@app.get("/sardiniapueblo/api/achievements/{player_id}")
async def get_achievements_from_player(player_id: int):
    return await dbachievements.get_achievements(player_id, True)


@app.post("/sardiniapueblo/api/achievements", dependencies=[Depends(require_auth)])
async def insert_achievement(achievement: dict):
    return await dbachievements.insert_achievement(achievement)


@app.delete("/sardiniapueblo/api/achievements/{ach_key}", dependencies=[Depends(require_auth)])
async def delete_achievement(ach_key: str):
    return await dbachievements.delete_achievement(ach_key)


@app.put("/sardiniapueblo/api/achievements/{ach_key}", dependencies=[Depends(require_auth)])
async def update_achievement(ach_key: str, achievement: dict):
    return await dbachievements.update_achievement(ach_key, achievement)


@app.get("/sardiniapueblo/api/getranked")
async def get_ranked():
    return await dbuser.get_ranked()


@app.patch("/sardiniapueblo/api/user/{chat_id}/public_name")
async def update_public_name(chat_id: int, args: dict):
    name = args.get("public_name")
    return await dbuser.add_public_name(chat_id, name)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, port=5001, host="127.0.0.1")
