from DB.dbservice import fetchrow, fetch


async def found_city(city: str):
    query = """
    SELECT c.id, c.nome, c.url, c.nome_originale, c.popolazione, c.superficie, c.altitudine, 
            p.title as nome_provincia, string_agg(t.nome, ', ') AS territorio
    FROM cities c
    JOIN provinces p on c.provincia = p.id
    LEFT JOIN territori t on t.comuni = c.id
    where nome_norm = $1 
    group by c.id, c.nome, c.url, c.nome_originale, c.popolazione, c.superficie, c.altitudine, nome_provincia
    """
    return await fetchrow(query, city.strip().upper())


async def search_city_space_free(text: str, chat_id):
    query = """
        select nome, player
        from cities c
        left join cities_found cf on cf.city = c.id and player = $2
        where replace(nome_norm, ' ', '') = replace($1, ' ', '')
        """  # A quanto pare devo mettere la condizione sul giocatore nella join
    return await fetchrow(query, text.strip().upper(), chat_id)


async def search_city_doubles(text: str, chat_id):
    query = """
        select nome, player
        from cities c
        left join cities_found cf on cf.city = c.id and player = $2
        where normalize_consecutive(nome_norm) = normalize_consecutive($1)
    """
    return await fetchrow(query, text.strip().upper(), chat_id)


async def search_city_subgroup(text: str, chat_id):
    query = f"""
        select nome, nome_norm, player
        from cities c
        left join cities_found cf on cf.city = c.id and player = $1
        where replace(nome_norm, ' ', '') like replace('%{text.strip().upper()}%', ' ', '')
    """
    return await fetch(query, chat_id)


async def all_cities():
    query = "SELECT c.id, c.nome from cities c"
    return await fetch(query)


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


async def found_player_cities(chat_id: int):
    query = """
        SELECT c.id, c.nome, c.url, c.nome_originale, c.popolazione, c.superficie, c.altitudine, 
                provincia, string_agg(t.nome, ', ') AS territorio
        FROM cities c
        LEFT JOIN territori t on t.comuni = c.id
        JOIN cities_found cf on cf.city = c.id
        where player = $1
        group by c.id, c.nome, c.url, c.nome_originale, c.popolazione, c.superficie, c.altitudine, provincia
    """
    return await fetch(query, chat_id)


async def found_player_cities_by_prov(chat_id: int, province: str):
    query = """
        SELECT 
         CASE when c.id in (
            select city
            from cities_found
            where cities_found.player = $1)
            then nome
            else regexp_replace(nome, '[[:alpha:]]', '*', 'g')
            end as all_names,
            nome,
            provincia
        FROM cities c
        where provincia = $2
        order by nome
    """
    return await fetch(query, chat_id, province)


async def found_player_cities_by_letter(chat_id: int, letter: str):
    query = """
        SELECT 
         CASE when c.id in (
            select city
            from cities_found
            where cities_found.player = $1)
            then nome
            else regexp_replace(nome, '[[:alpha:]]', '*', 'g')
            end as all_names,
            nome,
            provincia
        FROM cities c
        where starts_with(nome, $2) 
        order by nome
    """
    return await fetch(query, chat_id, letter)
