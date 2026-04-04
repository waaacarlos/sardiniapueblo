from Entities.User import TGUser
from DB.dbservice import fetchrow, execute, fetchval

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
    return await fetchval(query, chatid)
