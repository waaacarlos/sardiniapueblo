import logging
import unicodedata
import re

logger = logging.getLogger(__name__)


# Region: Strings
APOSTROFI = "'\u2019\u2018\u02BC\u0060\u00B4"


def normalize(testo):
    senza_accenti = unicodedata.normalize("NFD", testo)
    senza_accenti = "".join(c for c in senza_accenti if unicodedata.category(c) != "Mn")
    return re.sub(f"[{re.escape(APOSTROFI)}]", " ", senza_accenti)


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
