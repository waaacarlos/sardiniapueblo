from DB.dbservice import fetchrow, fetch


async def found_city(city: str):
    query = """
    SELECT *
    FROM cities
    where nome_norm = $1 
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


async def remove_all_from_chatid(chat_id: int):
    query = "DELETE FROM cities_found WHERE player = $1"
    return await fetchrow(query, chat_id)


async def found_cities(chat_id: int):
    query = """
    SELECT nome
    FROM cities
    JOIN cities_found ON cities_found.city = cities.id
    where cities_found.player = $1"""
    return await fetch(query, chat_id)
