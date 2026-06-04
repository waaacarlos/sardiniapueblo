from Entities.User import TGUser
from DB.dbservice import fetchrow, execute, fetchval, fetch

# ─────────────────────────────────────────────
# In-memory cache (per processo)
# ─────────────────────────────────────────────

_user_exists_cache: set[int] = set()
_user_player_cache: set[int] = set()


# ─────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────

async def insert_user_in_db(user: TGUser):
    """
    Ensure that the Telegram user exists in DB.
    Called once per update.
    """
    if user.id in _user_exists_cache:
        return
    row = await fetchrow(
        f"SELECT 1 FROM users WHERE id = {user.id}",
    )
    if row:
        _user_exists_cache.add(user.id)
        return
    await execute(user.insert_query())
    _user_exists_cache.add(user.id)


async def get_player_points(chatid: int):
    query = """
    SELECT points
    from player_points
    where player = $1
    """
    return await fetchval(query, chatid) or 0


async def get_user_details(chatid: int):
    query = """
    SELECT *
    FROM users
    WHERE id = $1
    """
    return await fetchrow(query, chatid) or []


async def remove_all_from_chatid(chat_id: int):
    query = "DELETE FROM users WHERE id = $1"
    if chat_id in _user_exists_cache:
        _user_exists_cache.remove(chat_id)
    if chat_id in _user_player_cache:
        _user_player_cache.remove(chat_id)
    return await fetchrow(query, chat_id)


async def add_log(m_id, chat_id, msg, response):
    query = """INSERT INTO player_try VALUES ($1, $2, $3, $4, NOW())"""
    return await fetch(query, m_id, chat_id, msg, response)


async def get_ranked():
    query = "select * from ranked order by points desc, attempts asc, ach desc"
    return await fetch(query)


async def add_public_name(chatid, name):
    query = "UPDATE users SET public_name = $1 WHERE id = $2"
    return await fetch(query, name, chatid)


async def get_list_count(chatid):
    query = f"""select count(*)
    from player_try
    where player = {chatid}
    and msg in('/list', '/list_province')"""
    return await fetchval(query)
