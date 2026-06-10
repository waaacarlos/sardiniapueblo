import json

from DB import dbachievements, dbuser
from Resources.config import ABS_FILE_PATH


async def check_achievement(player):
    unlocked = []
    write_achs = get_write_achievements()

    achievements = await dbachievements.get_achievements(player)
    points = await dbuser.get_player_points(player)
    for ach in achievements:
        key = ach['ach_key']
        if ach['category'] == 'progress':
            if points >= ach['threshold']:
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'city':
            if set(ach['cities']) <= set(ach['cities_found']):
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'province':
            counter_cities_found = await dbachievements.check_prov_achievements(player, ach['province'])
            if not counter_cities_found:
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'write':
            _q = write_achs.get(ach['ach_key'])
            result = await dbachievements.get_write_achievements(_q, player)
            if result:
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        else:
            raise Exception(f"Unknown category {ach['category']}")
    return unlocked


async def get_percentage_ach():
    return {ach['achievement']: ach['percentage'] for ach in await dbachievements.get_percentage_ach()}


def get_write_achievements():
    with open(ABS_FILE_PATH + "Resources/achievements.json") as f:
        return json.load(f)
