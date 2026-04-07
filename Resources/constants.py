# query commands
import json
from pathlib import Path

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

