import logging

from BL.utility import normalize
from DB import dbcities
from Resources.messages import messages


async def search_city(text, chat_id):
    text = normalize(text)
    city = await dbcities.found_city(text)
    if city:
        logging.info(f"Found city: {city['id']}")
        city_info = messages("city").format(
            city['nome'],
            city['nome_originale'], city['url'],
            f"{city['popolazione']:_}".replace("_", "."),
            format(city['superficie'], "_.2f").replace(".", ","),
            city['altitudine']
        )
        result = await dbcities.add_city(city['id'], chat_id)
        if result:
            msg_to_send = messages("city_found") + city_info
        else:
            msg_to_send = messages("already_found") + city_info
    else:

        msg_to_send = messages("not_found")
    return msg_to_send


async def reset_user(chat_id):
    await dbcities.remove_all_from_chatid(chat_id)
    return messages("reset")
