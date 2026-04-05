import logging

from BL.utility import normalize
from DB import dbcities, dbuser
from Resources import constants
from Resources.messages import messages


async def search_city(text, chat_id):
    text = normalize(text)
    city = await dbcities.found_city(text)
    if city:
        logging.info(f"Found city: {city['id']}")
        city_info = messages("city").format(
            city['url'],
            city['nome'],
            city['nome_originale'],
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
        msg_to_send = messages("not_found")
    return msg_to_send


async def reset_user(chat_id):
    await dbcities.remove_all_from_chatid(chat_id)
    return messages("reset")


async def list_cities(chat_id, province="CA"):  # da paginare?
    cities = await dbcities.found_cities(chat_id, province)
    msg_to_send = messages("cities_found").format(constants.PROVINCES[province])
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
