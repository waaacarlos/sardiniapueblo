import logging
import unicodedata
import re
from enum import Enum, auto

logger = logging.getLogger(__name__)


# Region: Strings
APOSTROFI = "'\u2019\u2018\u02BC\u0060\u00B4"


class FindSpace(Enum):
    NO_SPACE = auto()
    SPACE = auto()
    NO_SPACE_MULTIPLE = auto()
    SPACE_MULTIPLE = auto()
    MIXED_SPACE = auto()


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


def subgroup(s1: str, s2: str, placeholder='*'):
    def mask(s: str) -> str:
        return "".join(c if not c.isalpha() else placeholder for c in s)

    s1_nospace = s1.replace(" ", "")
    s2_nospace = s2.replace(" ", "")
    idx = s1_nospace.find(s2_nospace)

    result = mask(s1_nospace[:idx]) + s2_nospace + mask(s1_nospace[idx + len(s2_nospace):])
    spaces = get_char_index(s1)

    for i in range(len(spaces)):
        space = spaces[i]
        result = result[:space] + " " + result[space:]
    return result


def get_char_index(s: str, c=" "):
    return [i for i in range(len(s)) if s[i] == c]


def starts_same(s1, s2):
    common_letters = ""
    for c1, c2 in zip(s1, s2):
        if c1.upper() == c2.upper():
            common_letters += c1
        else:
            break
    return common_letters


def same_letters(s1, s2, placeholder='*'):
    for c1 in s1:
        if c1 not in s2 and c1.isalpha():
            s1 = s1.replace(c1, placeholder)
    return s1


def find_spaces(s1: str, s2: str) -> FindSpace:
    # CASI VALORI SINGOLI
    a = s1.split()
    b = s2.split()
    if len(a) == 1 and len(b) > 1:
        return FindSpace.NO_SPACE
    if len(b) == 1 and len(a) > 1:
        return FindSpace.SPACE

    # CASI VALORI MULTIPLI
    a = [word for word in s1.split() if word not in s2.split()]
    b = [word for word in s2.split() if word not in s1.split()]
    if len(a) > len(b):
        return FindSpace.SPACE_MULTIPLE
    if len(b) > len(a):
        return FindSpace.NO_SPACE_MULTIPLE
    return FindSpace.MIXED_SPACE


def normalize_consecutive(s):
    s = s.lower()
    return s[0] + ''.join(s[i] for i in range(1, len(s)) if s[i] != s[i-1])
