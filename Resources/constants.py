# query commands
import os
from enum import Enum

from dotenv import load_dotenv

insertquery = "INSERT INTO {0} {2} VALUES ({1})"
conflict = " ON CONFLICT "
onconstraint = " ON CONSTRAINT {0} "
donothing = " DO NOTHING"
doupdate = " DO UPDATE SET "

updatequery = "UPDATE {0} SET {1} WHERE {2}"

deletequery = "DELETE FROM {0} WHERE {1}"

CITIES_COUNT = 377

PROVINCES = {
    "CA": 'città metropolitana di Cagliari',
    "SS": 'città metropolitana di Sassari',
    "OR": 'provincia di Oristano',
    "NU": 'provincia di Nuoro',
    "CI": 'provincia di Sulcis Iglesiente',
    "OG": 'provincia di Ogliastra',
    "VS": 'provincia di Medio Campidano',
    "OT": 'provincia di Gallura Nord-Est Sardegna'
}

load_dotenv()
STATSURL = os.getenv('APP_URL') + "?playerId={0}"
RANKURL = STATSURL + "&page=ranked"


class SearchCase(Enum):
    NONE = "none"
    START = "start"
    SEARCHING = "searching"
    NEW_FOUND = "new_found"
    ALREADY_FOUND = "already_found"
    SPACES_ALREADY_FOUND = "spaces_already_found"
    SPACES_NOT_FOUND = "spaces_not_found"
    NOTSPACES_NOT_FOUND = "notspaces_not_found"
    MIXED_SPACES_NOT_FOUND = "mixed_spaces_not_found"
    SPACE_MULTIPLE_NOT_FOUND = "space_multiple_not_found"
    NOT_SPACE_MULTIPLE_NOT_FOUND = "not_space_multiple_not_found"
    DOUBLES_ALREADY_FOUND = "doubles"
    DOUBLES_NOT_FOUND = "doubles_not_found"
    SUBNAME_ALREADY_FOUND = "subname_already_found"
    SUBNAME_NOT_FOUND = "subname_not_found"
    SUBNAME_MULTIPLE = "subname_multiple"
    SIMILAR_FOUND = "similar"
    SIMILAR_NOT_FOUND = "similar_not_found"
    SIMILAR_MULTIPLE = "similar_multiple"
    NOT_FOUND = "not_found"
