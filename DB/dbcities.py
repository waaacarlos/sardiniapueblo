from DB.dbservice import fetchrow, fetch


async def found_city(city: str):
    query = """
    SELECT c.*, p.title as nome_provincia
    FROM cities c
    JOIN provinces p on c.provincia = p.id
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


async def found_cities_by_prov(chat_id: int, province: str):
    query = """
        SELECT 
         CASE when c.id in (
            select city
            from cities_found
            where cities_found.player = $1)
            then nome
            else repeat('*', length(nome))
            end as all_names
        FROM cities c
        where provincia = $2
        order by nome
    """
    return await fetch(query, chat_id, province)


async def found_cities_by_letter(chat_id: int, letter: str):
    query = """
        SELECT 
         CASE when c.id in (
            select city
            from cities_found
            where cities_found.player = $1)
            then nome
            else repeat('*', length(nome))
            end as all_names,
            provincia
        FROM cities c
        where starts_with(nome, $2) 
        order by nome
    """
    return await fetch(query, chat_id, letter)
