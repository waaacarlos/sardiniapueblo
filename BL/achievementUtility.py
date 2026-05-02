import json

from DB import dbachievements, dbuser, dbcities
from Resources.config import ABS_FILE_PATH


async def check_achievement(player, event=None):
    unlocked = []
    achievements = await dbachievements.get_achievements(player)
    cities_found = [i['id'] for i in await dbcities.found_player_all_cities(player)]
    points = await dbuser.get_player_points(player)
    for ach in achievements:
        key = ach['ach_key']
        if event and not ach['category'] == 'write':
            continue
        if ach['category'] == 'progress':
            if points >= ach['threshold']:
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'city':
            # counter_cities_found = await dbachievements.check_cities_achievements(player, ach['cities'])
            if set(ach['cities']) <= set(cities_found):
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'province':
            counter_cities_found = await dbachievements.check_prov_achievements(player, ach['province'])
            if not counter_cities_found:
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'write':
            if ach['event'] == event:
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        else:
            raise Exception(f"Unknown category {ach['category']}")
    return unlocked


async def get_percentage_ach():
    return {ach['achievement']: ach['percentage'] for ach in await dbachievements.get_percentage_ach()}
