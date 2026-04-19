from DB.dbservice import fetchrow, fetch
from enum import Enum


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


class CitySearchMode(Enum):
    SPACE_FREE = ("replace(nome_norm, ' ', '') = replace($2, ' ', '')", False)
    DOUBLES = ("normalize_consecutive(nome_norm) = normalize_consecutive($2)", False)
    SUBGROUP = ("replace(nome_norm, ' ', '') LIKE replace('%' || $2 || '%', ' ', '')", True)
    SIMILAR = ("similarity(nome_norm, $2) > 0.4", True)

    def __init__(self, clause: str, multi: bool):
        self.clause = clause
        self.multi = multi


async def _search_city(mode: CitySearchMode, text: str, chat_id: int):
    extra_col = ", nome_norm" if mode.multi else ""
    query = f"""
        SELECT nome{extra_col}, player
        FROM cities c
        LEFT JOIN cities_found cf ON cf.city = c.id AND player = $1
        WHERE {mode.clause}
    """
    fn = fetch if mode.multi else fetchrow
    return await fn(query, chat_id, text.strip().upper())


async def search_city_space_free(text: str, chat_id: int):
    return await _search_city(CitySearchMode.SPACE_FREE, text, chat_id)


async def search_city_doubles(text: str, chat_id: int):
    return await _search_city(CitySearchMode.DOUBLES, text, chat_id)


async def search_city_subgroup(text: str, chat_id: int):
    return await _search_city(CitySearchMode.SUBGROUP, text, chat_id)


async def search_city_similar(text: str, chat_id: int):
    return await _search_city(CitySearchMode.SIMILAR, text, chat_id)


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


async def found_player_all_cities(chat_id: int):
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


async def found_player_cities(chat_id: int, filter_clause: str, filter_value: str):
    query = f"""
        SELECT 
            CASE WHEN c.id IN (
                SELECT city
                FROM cities_found
                WHERE cities_found.player = $1)
                THEN nome
                ELSE regexp_replace(nome, '[[:alpha:]]', '*', 'g')
            END AS all_names,
            nome,
            provincia
        FROM cities c
        WHERE {filter_clause}
        ORDER BY nome
    """
    return await fetch(query, chat_id, filter_value)


async def found_player_cities_by_prov(chat_id: int, province: str):
    return await found_player_cities(chat_id, "provincia = $2", province)


async def found_player_cities_by_letter(chat_id: int, letter: str):
    return await found_player_cities(chat_id, "starts_with(nome, $2)", letter)
