import logging


logger = logging.getLogger(__name__)


# Region: Strings
def only_alphanumeric(text):
    text_filtered = ""
    for i in text:
        if i in "0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM":
            text_filtered += i
        else:
            text_filtered += " "
    return text_filtered


def remove_double_spaces(text):
    while "  " in text:
        text = text.replace("  ", " ")
    return text


def is_a_number(text):
    try:
        int(text)
    except ValueError:
        return False
    else:
        return True


# Regions: lists
def separe_array(array):
    rows = []
    if 5 <= len(array) < 7:
        module = 3
    else:
        module = 4
    for i in range(len(array)):
        if i % module == 0:
            rows.append([])
        rows[-1].append(array[i])
    return rows


def create_string_format_numerate(n: int):
    return "".join(["'{%s}', " % i for i in range(n)])[:-2]


def create_string_format_key_pair(attr, skip=0):
    return "".join(["%s = '{%s}', " % (i, attr.index(i)) for i in attr[skip:]])[:-2]


def log(text):
    logger.info(str(text))
