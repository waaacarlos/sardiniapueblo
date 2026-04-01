from DB.dbservice import fetchrow


async def found_city(city: str):
    query = """
    SELECT *
    FROM cities
    where trim(upper(nome)) = $1 
    """
    return await fetchrow(query, city.strip().upper())


async def add_city(city: str, chat_id: int):
    query = """
        INSERT INTO cities_found (player, city)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING player
    """
    return await fetchrow(query, chat_id, city)
