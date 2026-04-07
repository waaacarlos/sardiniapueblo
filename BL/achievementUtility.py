import json
from pathlib import Path
from DB import dbachievements, dbuser

ACHIEVEMENTS = json.loads(Path("achievements.json").read_text())


async def check_achievement(player, event=None):
    player_unlocked = await dbachievements.get_player_achievements(player)
    unlocked = []

    for key, ach in ACHIEVEMENTS.items():
        if event and not ach['category'] == 'write':
            continue
        if key in player_unlocked:
            continue
        if ach['category'] == 'progress':
            points = await dbuser.get_player_points(player)
            if points >= ach['threshold']:
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'city':
            counter_cities_found = await dbachievements.check_cities_achievements(player, ach['cities'])
            if counter_cities_found >= len(ach['cities']):
                unlocked.append(ach)
                await dbachievements.add_achievement(key, player)
        elif ach['category'] == 'city_province':
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
