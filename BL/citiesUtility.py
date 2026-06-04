import logging

import DB.dbuser
from BL import utility
from BL.utility import normalize, starts_same
from DB import dbcities, dbuser
from Resources import constants
from Resources.messages import messages


async def _build_city_info(city: dict, chat_id: int) -> str:
    city_info = messages("city").format(
        city['url'],
        city['nome'],
        city['nome_originale'],
        city['territorio'] or '',
        city['nome_provincia'],
        f"{city['popolazione']:_}".replace("_", "."),
        format(city['superficie'], "_.2f").replace(".", ","),
        city['altitudine']
    )
    result = await dbcities.add_city(city['id'], chat_id)
    msg = messages("city_found" if result else "already_found") + city_info

    points = await dbuser.get_player_points(chat_id)
    if points > 1:
        msg += "\n\n" + messages("found_count").format(points)
    if not(points % 5):
        already_list = await dbuser.get_list_count(chat_id)
        if already_list == 0:
            msg += messages("list")
    return msg


async def _search_fallbacks(text: str, chat_id: int) -> str:
    # Controllo spazi
    city = await dbcities.search_city_space_free(text, chat_id)
    if city:
        if city['player']:
            return messages("similar_found").format(city['nome'])
        else:
            # Controllo apostrofo -- Se trova uguale a meno degli apostrofi, gliela diamo buona
            if text.upper().replace("'", "") == utility.normalize(city['nome'].upper().replace("'", "")):
                return await search_city(city['nome'], chat_id)
            # Verifica cosa è scritto staccato e cosa no
            _cases = utility.find_spaces(city['nome'], text)
            if _cases == utility.FindSpace.SPACE:
                _msgcase = "spaces_not_found"
            elif _cases == utility.FindSpace.NO_SPACE:
                _msgcase = "notspaces_not_found"
            elif _cases == utility.FindSpace.MIXED_SPACE:
                _msgcase = "mixedspaces_not_found"
            elif _cases == utility.FindSpace.SPACE_MULTIPLE:
                _msgcase = "spacesmult_not_found"
            elif _cases == utility.FindSpace.NO_SPACE_MULTIPLE:
                _msgcase = "notspacesmult_not_found"
            else:
                raise NotImplementedError
            return messages(_msgcase)

    # Controllo doppie
    city = await dbcities.search_city_doubles(text, chat_id)
    if city:
        if city['player']:
            return messages("similar_found").format(city['nome'])
        return messages("doubles_not_found")

    # Controllo nome parziale
    if len(text) > 3:
        cities = await dbcities.search_city_subgroup(text, chat_id)
        cities_count = len(cities)
        if cities_count == 1:
            city = cities[0]
            if city['player']:
                return messages("similar_found").format(city['nome'])
            hint = utility.subgroup(city['nome_norm'], text.strip().upper())
            return messages("single_substring_not_found").format(hint)
        elif cities_count > 1:
            found = [i['nome'] for i in cities if i['player']]
            msg = messages("multiple_substring").format(cities_count, text.strip().upper())
            if found:
                msg += messages("multiple_similar_hint_already_found").format(len(found), ", ".join(found))
            if len(found) < cities_count:
                msg += messages("hint_single" if cities_count - len(found) == 1 else "hint_multiple")
                counter = 0
                for city in [i for i in cities if i['nome'] not in found]:
                    counter += 1
                    hint = utility.subgroup(city['nome_norm'], text.strip().upper())
                    msg += f"\n{str(counter).zfill(2)}. <code>{hint}</code>"
                    if '*' not in hint:
                        msg += messages("all_hinted")
            return msg
    
    # Controllo simili
    if len(text) > 3:
        cities = await dbcities.search_city_similar(text, chat_id)
        cities_count = len(cities)
        if cities_count == 1:
            city = cities[0]
            if city['player']:
                return messages("similar_found").format(city['nome'])
            hint = utility.same_letters(city['nome_norm'], text.strip().upper())
            msg = messages("similar_city_hint")
            if '*' not in hint:
                msg += messages("all_hinted")
            return msg.format(hint)
        elif cities_count > 1:
            found = [i['nome'] for i in cities if i['player']]
            msg = messages("multiple_similar_hint_count").format(cities_count)
            if found:
                msg += messages("multiple_similar_hint_already_found").format(len(found), ", ".join(found))
            if len(found) < cities_count:
                msg += messages("hint_single" if cities_count - len(found) == 1 else "hint_multiple")
                counter = 0
                for city in [i for i in cities if i['nome'] not in found]:
                    counter += 1
                    hint = utility.same_letters(city['nome_norm'], text.strip().upper())
                    msg += f"\n{str(counter).zfill(2)}. <code>{hint}</code>"
                    if '*' not in hint:
                        msg += messages("all_hinted")
            return msg
    return messages("not_found")


async def search_city(text: str, chat_id: int) -> str:
    text = normalize(text)
    city = await dbcities.found_city(text)
    if city:
        logging.info(f"Found city: {city['id']}")
        return await _build_city_info(city, chat_id)
    return await _search_fallbacks(text, chat_id)


async def reset_user(chat_id):
    await DB.dbuser.remove_all_from_chatid(chat_id)
    return messages("reset")


async def list_cities_by_letter(chat_id, letter='A'):
    msg_to_send = messages("cities_found").format(letter)
    cities = await dbcities.found_player_cities_by_letter(chat_id, letter)

    msg_to_send = build_city_list(cities, msg_to_send)

    msg_to_send += f"\n{messages("cities_missing_count").format(
        len(cities) - len([i for i in cities if '*' not in i['all_names']]),
        letter
    )}"
    return msg_to_send


def build_city_list(cities, msg_to_send):
    only_found = [city['nome'] for city in cities if '*' not in city['all_names']]
    counter = 0
    previous_found = ""
    for city in cities:
        counter += 1
        city_name = city['all_names']
        if '*' in city_name:
            idx = only_found.index(previous_found) if previous_found else -1
            if previous_found == "" or idx == len(only_found) - 1:
                prefix = city["nome"][0]
            else:
                next_found = only_found[idx + 1]
                prefix = starts_same(previous_found, next_found)
                if not prefix:
                    prefix = city["nome"][0]
            city_name = f"{prefix}<tg-spoiler>{city_name[max(len(prefix), 1):]}</tg-spoiler>"
        else:
            previous_found = city_name
        msg_to_send += f"{str(counter).zfill(2)}. [{city['provincia']}] {city_name}\n"
    return msg_to_send


async def list_cities_by_prov(chat_id, province="CA"):  # da paginare?
    cities = await dbcities.found_player_cities_by_prov(chat_id, province)
    msg_to_send = messages("cities_found_by_prov").format(constants.PROVINCES[province])

    msg_to_send = build_city_list(cities, msg_to_send)

    msg_to_send += f"\n{messages("cities_missing_count").format(
        len(cities) - len([i for i in cities if '*' not in i['all_names']]),
        constants.PROVINCES[province]
    )}"
    return msg_to_send
