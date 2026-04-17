import logging

from BL import utility
from BL.utility import normalize
from DB import dbcities, dbuser
from Resources import constants
from Resources.messages import messages


async def search_city(text, chat_id):
    text = normalize(text)
    city = await dbcities.found_city(text)
    msg_to_send = messages("not_found")
    if city:
        logging.info(f"Found city: {city['id']}")
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
        if result:
            msg_to_send = messages("city_found") + city_info
        else:
            msg_to_send = messages("already_found") + city_info
        points = await dbuser.get_player_points(chat_id)
        if points > 1:
            msg_to_send += "\n\n" + messages("found_count").format(points)
    else:
        # Controllo spazi
        city = await dbcities.search_city_space_free(text, chat_id)
        if city:
            if city['player']:
                msg_to_send = messages("spaces_found").format(city['nome'])
            else:
                if ' ' in text:
                    msg_to_send = messages("notspaces_not_found")
                else:
                    msg_to_send = messages("spaces_not_found")
        # Controllo doppie
        city = await dbcities.search_city_doubles(text, chat_id)
        if city:
            if city['player']:
                msg_to_send = messages("similar_found").format(city['nome'])
            else:
                msg_to_send = messages("doubles_not_found")
        # Controllo nome parziale
        if len(text) > 3:
            cities = await dbcities.search_city_subgroup(text, chat_id)
            cities_count = len(cities)
            if cities_count == 1:
                city = cities[0]
                if city['player']:
                    msg_to_send = messages("similar_found").format(city['nome'])
                else:
                    hint = utility.subgroup(city['nome_norm'], text.strip().upper())
                    msg_to_send = messages("single_substring_not_found").format(hint)
            elif cities_count > 1:
                found = [i['nome'] for i in cities if i['player']]
                msg_to_send = messages("multiple_substring").format(
                    cities_count, text, len(found), ", ".join(found)
                )
    return msg_to_send


async def reset_user(chat_id):
    await dbcities.remove_all_from_chatid(chat_id)
    return messages("reset")


async def list_cities_by_letter(chat_id, letter='A'):
    cities = await dbcities.found_player_cities_by_letter(chat_id, letter)
    msg_to_send = messages("cities_found")
    counter = 0
    for city in cities:
        counter += 1
        city_name = city['all_names']
        if '*' in city_name:
            city_name = f" <tg-spoiler>{city_name}</tg-spoiler>"
        msg_to_send += f"{counter}. [{city['provincia']}] {city_name}\n"
    msg_to_send += f"\n{messages("cities_missing_count").format(
        len(cities) - len([i for i in cities if '*' not in i['all_names']]),
        letter
    )}"
    return msg_to_send


async def list_cities_by_prov(chat_id, province="CA"):  # da paginare?
    cities = await dbcities.found_player_cities_by_prov(chat_id, province)
    msg_to_send = messages("cities_found_by_prov").format(constants.PROVINCES[province])
    counter = 0
    for city in cities:
        counter += 1
        city_name = city['all_names']
        if '*' in city_name:
            city_name = f"<tg-spoiler>{city_name}</tg-spoiler>"
        msg_to_send += f"{counter}. {city_name}\n"
    msg_to_send += f"\n{messages("cities_missing_count").format(
        len(cities) - len([i for i in cities if '*' not in i['all_names']]),
        constants.PROVINCES[province]
    )}"
    return msg_to_send
