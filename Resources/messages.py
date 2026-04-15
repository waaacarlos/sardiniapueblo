import json
from emoji import emojize
from Resources.config import ABS_FILE_PATH


LANGUAGE = "it"


def messages(message, language=LANGUAGE):
    dictionary = get_dictionary(language)
    try:
        return dictionary[message]  # TODO EMOJI # get_emoji(message) +
    except KeyError:
        return str(message) if language == LANGUAGE else messages(LANGUAGE, message)


def get_dictionary(language):
    try:
        with open(f"{ABS_FILE_PATH}Resources/Languages/{language}.json") as f:
            return json.load(f)
    except:
        with open(ABS_FILE_PATH + "Resources/Languages/it.json"):
            return json.load(f)


def get_emoji(message):
    try:
        emoji = emojize(get_dictionary("emojize")[message])
    except KeyError:
        emoji = ""
    emoji = emoji + " " if emoji else emoji
    return emoji


def counter(word: str, count: int, language=LANGUAGE):
    try:
        dictionary = get_language(language)
        if count == 1:
            phrase = dictionary[word]
        else:
            if 2 <= count <= 10:
                count_to_text = dictionary['numbers'][str(count)]
            else:
                count_to_text = count
            phrase = "{0} {1}".format(count_to_text, dictionary[word + 's'])
        return phrase
    except KeyError:
        return counter(word, count, LANGUAGE) \
            if language != LANGUAGE else messages(LANGUAGE, "{0} {1}".format(count, word))


def get_language(language):
    try:
        dictionary = get_dictionary(language)
    except (FileNotFoundError, IOError):
        dictionary = get_dictionary(LANGUAGE)
    return dictionary
