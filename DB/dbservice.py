# DB.py
import asyncpg
import logging
import os
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

pool: asyncpg.Pool | None = None


async def init_db():
    global pool
    if pool:
        return
    pool = await asyncpg.create_pool(
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASS"),
        database="sardiniapueblo",
        host=os.environ.get("IP_ADDRESS"),
        port=int(os.environ.get("DB_PORT", 5432)),
        min_size=1,
        max_size=10,
        command_timeout=30,
    )
    logger.info("Database pool initialized")


async def close_db():
    global pool
    if pool:
        await pool.close()
        logger.info("Database pool closed")


async def fetch(query: str, *args):
    # logging.info(f"Fetching all {query}")
    try:
        async with pool.acquire() as conn:
            return await conn.fetch(query, *args)
    except Exception as e:
        logger.error(f"Error fetching {query}: {e}")
        raise e


async def fetchrow(query: str, *args):
    # logging.info(f"Fetching row {query}")
    try:
        async with pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
    except Exception as e:
        logger.error(f"Error fetching {query}: {e}")


async def execute(query: str, *args):
    # logging.info(f"Executing {query}")
    try:
        async with pool.acquire() as conn:
            await conn.execute(query, *args)
    except Exception as e:
        logger.error(f"Error executing {query}: {e}")


async def fetchval(query: str, *args):
    # logging.info(f"Fetching val {query}")
    try:
        async with pool.acquire() as conn:
            return await conn.fetchval(query, *args)
    except Exception as e:
        logger.error(f"Error fetching {query}: {e}")


async def executemany(query: str, *args):
    # logging.info(f"Executing {query}")
    try:
        async with pool.acquire() as conn:
            return await conn.executemany(query, *args)
    except Exception as e:
        logger.error(f"Error fetching {query}: {e}")


@asynccontextmanager
async def get_transaction():
    async with pool.acquire() as conn:
        yield conn
