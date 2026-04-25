from DB.dbservice import fetchrow, fetch, fetchval, get_transaction


def _normalize_achievement_payload(achievement):
    category = achievement["category"]
    if category == "event":
        category = "write"

    threshold = achievement.get("threshold") if category == "progress" else None
    province = achievement.get("province") if category == "province" else None
    event = achievement.get("event") if category == "write" else None

    return category, threshold, province, event


async def get_achievements(chat_id=None):
    query = """
        SELECT a.ach_key, a.title, a.description, a.category, a.threshold, a.province, a.event, 
        array_remove(array_agg(ac.city), NULL) as cities
        FROM public.achievements a
        left join achievement_cities ac on ac.ach_key = a.ach_key
    """
    args = []
    if chat_id is not None:
        query += f"""
            left outer join user_achievements ua on ua.achievement = a.ach_key
            and player = $1
            where player is null
        """
        args.append(chat_id)
    query += "group by a.ach_key, a.title, a.description, a.category, a.threshold, a.province, a.event order by a.title"
    return await fetch(query, *args)


async def get_player_achievements(chat_id):
    query = """
    select achievement
    from user_achievements
    where player = $1
    """
    result = await fetch(query, chat_id) or []
    return [i['achievement'] for i in result]


async def add_achievement(achievement, chat_id):
    query = """
    insert into user_achievements (player, achievement)
    values ($1, $2)
    returning unlocked
    """
    return await fetchrow(query, chat_id, achievement)


async def check_cities_achievements(chat_id: int, cities: tuple):
    query = """
    select count(*)
    from cities_found cf
    join cities c on c.id = cf.city
    where player = $1
    and nome = ANY($2)
    """
    return await fetchval(query, chat_id, cities) or 0


async def check_prov_achievements(chat_id, province):
    query = """
    SELECT count(*)
    FROM cities c
    LEFT JOIN cities_found cf ON c.id = cf.city AND cf.player = $1
    WHERE c.provincia = $2
    AND cf.city IS NULL;
    """
    return await fetchval(query, chat_id, province) or 0


async def insert_achievement(achievement):
    category, threshold, province, event = _normalize_achievement_payload(achievement)
    query = """
    INSERT INTO achievements (ach_key, title, description, category, threshold, province, event)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
    """
    _args = [
        achievement['key'],
        achievement['title'],
        achievement['description'],
        category,
        threshold,
        province,
        event,
    ]

    async with get_transaction() as conn:
        async with conn.transaction():
            res = await conn.execute(query, *_args)
            if category == "city":
                rows = [(achievement["key"], city['id']) for city in achievement["cities"]]
                await conn.executemany("INSERT INTO achievement_cities (ach_key, city) VALUES ($1, $2)", rows)
    return res


async def delete_achievement(ach_key):
    query = "DELETE FROM achievements WHERE ach_key = $1"
    return await fetch(query, ach_key)


async def update_achievement(ach_key, achievement):
    category, threshold, province, event = _normalize_achievement_payload(achievement)
    query = """
        UPDATE achievements
        SET title = $2,
            description = $3,
            category = $4,
            threshold = $5,
            province = $6,
            event = $7
        WHERE ach_key = $1"""

    async with get_transaction() as conn:
        async with conn.transaction():
            res = await conn.execute(
                query,
                ach_key,
                achievement["title"],
                achievement["description"],
                category,
                threshold,
                province,
                event,
            )

            await conn.execute("DELETE FROM achievement_cities WHERE ach_key = $1", ach_key)

            if category == "city":
                rows = [(ach_key, city['id']) for city in achievement.get("cities", [])]
                if rows:
                    await conn.executemany(
                        "INSERT INTO achievement_cities (ach_key, city) VALUES ($1, $2)",
                        rows,
                    )

    return res
