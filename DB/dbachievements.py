from DB.dbservice import fetchrow, fetch, fetchval


async def get_player_achievements(chat_id):
    query = """
    select achievement
    from user_achievements
    where player = $1
    """
    result = await fetch(query, chat_id) or []
    return [i['achievement'] for i in result]


async def add_achievement(chat_id, achievement):
    query = """
    insert into user_achievements (player, achievement)
    values ($1, $2)
    returning unlocked
    """
    return await fetchrow(query, achievement, chat_id)


async def check_cities_achievements(chat_id: int, cities: tuple):
    query = """
    select count(*)
    from cities_found cf
    join cities c on c.id = cf.city
    where player = $1
    and nome = ANY($2)
    """
    return await fetchval(query, chat_id, cities) or 0


async def check_prov_achievements(chat_id: int, province):
    query = """
    SELECT count(*)
    FROM cities c
    LEFT JOIN cities_found cf ON c.id = cf.city AND cf.player = $1
    WHERE c.provincia = '$2'
    AND cf.city IS NULL;
    """
    return await fetchval(query, chat_id, province) or 0
