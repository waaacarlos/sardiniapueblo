from DB.dbservice import fetchrow, fetch, fetchval, get_transaction


def _normalize_achievement_payload(achievement):
    category = achievement["category"]
    if category == "event":
        category = "write"

    threshold = int(achievement.get("threshold")) if category == "progress" else None
    province = achievement.get("province") if category == "province" else None
    event = achievement.get("event") if category == "write" else None

    return category, threshold, province, event


async def get_achievements(chat_id=None, include_all=False):
    if not chat_id:
        return await _get_achievements_anonymous()
    return await _get_achievements_for_player(chat_id, include_all)


async def _get_achievements_anonymous():
    query = """
        SELECT a.ach_key, a.title, a.description, a.category, a.threshold,
               a.province, a.title_visible, a.description_visible,
               NULL::boolean AS new_ach,
               array_remove(array_agg(ac.city), NULL) AS cities,
               NULL::text[] AS cities_found
        FROM public.achievements a
        LEFT JOIN achievement_cities ac ON ac.ach_key = a.ach_key
        GROUP BY a.ach_key, a.title, a.description, a.category, a.threshold,
                 a.province, a.title_visible, a.description_visible
        ORDER BY a.title
    """
    return await fetch(query)


async def _get_achievements_for_player(chat_id, include_all):
    query = """
        WITH last_try AS (
            SELECT send_time FROM player_try
            WHERE player = $1 ORDER BY send_time DESC LIMIT 1
        )
        SELECT a.ach_key, a.title, a.description, a.category, a.threshold,
               a.province, a.title_visible, a.description_visible,
               a.created > COALESCE(MAX(cf.found_time), lt.send_time) AS new_ach,
               array_remove(array_agg(ac.city), NULL) AS cities,
               array_remove(array_agg(cf.city), NULL) AS cities_found
        FROM public.achievements a
        CROSS JOIN last_try lt
        LEFT JOIN achievement_cities ac ON ac.ach_key = a.ach_key
        LEFT JOIN cities_found cf ON ac.city = cf.city AND cf.player = $1
        LEFT JOIN user_achievements ua ON ua.achievement = a.ach_key AND ua.player = $1
    """
    if not include_all:
        query += "WHERE ua.player IS NULL\n"
    query += """
        GROUP BY a.ach_key, a.title, a.description, a.category, a.threshold,
                 a.province, a.title_visible, a.description_visible, lt.send_time
        ORDER BY a.title
    """
    return await fetch(query, chat_id)


async def get_player_achievements(chat_id):
    query = """
    select a.ach_key, title, description, category, threshold, province, event, title_visible, description_visible,
        percentage, unlocked, array_remove(array_agg(ac.city), NULL) as cities
    from user_achievements ua
    right join achievements a on ua.achievement = a.ach_key and player = $1
    join achievement_global g on a.ach_key = g.achievement
    left join achievement_cities ac on ac.ach_key = a.ach_key
    group by a.ach_key, title, description, category, threshold, province, event, title_visible, description_visible,
        percentage, unlocked
    order by percentage desc
    """
    result = await fetch(query, chat_id) or []
    return result


async def get_write_achievements(query, chat_id):
    return await fetchval(query, chat_id)


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
            event = $7,
            title_visible = $8,
            description_visible = $9
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
                achievement["title_visible"],
                achievement["description_visible"],
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


async def get_percentage_ach():
    q = """with player as (select count(*) as cnt from users where id > 1000)
        select achievement, count(achievement)*100 / player.cnt as percentage
        from user_achievements a, player
        group by achievement, player.cnt
    """
    return await fetch(q)
