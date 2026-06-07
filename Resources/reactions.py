from telegram.constants import ReactionEmoji
from random import choice


def success():
    return choice([
        ReactionEmoji.THUMBS_UP,
        ReactionEmoji.RED_HEART,
        ReactionEmoji.HEART_WITH_ARROW,
        ReactionEmoji.SQUARED_COOL,
        ReactionEmoji.FIRE,
        ReactionEmoji.SMILING_FACE_WITH_HEARTS,
        ReactionEmoji.CLAPPING_HANDS,
        ReactionEmoji.GRINNING_FACE_WITH_SMILING_EYES,
        ReactionEmoji.PARTY_POPPER,
        ReactionEmoji.GRINNING_FACE_WITH_STAR_EYES,
        ReactionEmoji.OK_HAND_SIGN,
        ReactionEmoji.SMILING_FACE_WITH_HEART_SHAPED_EYES,
        ReactionEmoji.HEART_ON_FIRE,
        ReactionEmoji.TROPHY,
        ReactionEmoji.HUNDRED_POINTS_SYMBOL,
        ReactionEmoji.SMILING_FACE_WITH_SUNGLASSES,
        ReactionEmoji.FACE_THROWING_A_KISS,
        ReactionEmoji.UNICORN_FACE,
        ReactionEmoji.BOTTLE_WITH_POPPING_CORK,
        ReactionEmoji.NERD_FACE,
        ReactionEmoji.NAIL_POLISH,
        ReactionEmoji.GRINNING_FACE_WITH_ONE_LARGE_AND_ONE_SMALL_EYE,
    ])


def already_found():
    return choice([
        ReactionEmoji.WOMAN_SHRUGGING,
        ReactionEmoji.SHRUG,
        ReactionEmoji.MAN_SHRUGGING,
    ])


def failure():
    return choice([
        ReactionEmoji.THUMBS_DOWN,
        ReactionEmoji.HEAR_NO_EVIL_MONKEY,
        ReactionEmoji.CRYING_FACE,
        ReactionEmoji.CLOWN_FACE,
        ReactionEmoji.POUTING_FACE,
        ReactionEmoji.NEW_MOON_WITH_FACE,
        ReactionEmoji.BROKEN_HEART,
        ReactionEmoji.HIGH_VOLTAGE_SIGN,
        ReactionEmoji.LOUDLY_CRYING_FACE,
        ReactionEmoji.SEE_NO_EVIL_MONKEY
    ])


def searching():
    return choice([
        ReactionEmoji.THINKING_FACE,
        ReactionEmoji.MAN_TECHNOLOGIST,
        ReactionEmoji.EYES,
        ReactionEmoji.WRITING_HAND,
        ReactionEmoji.SALUTING_FACE,
    ])


def almost():
    return choice([
        ReactionEmoji.THINKING_FACE,
        ReactionEmoji.SHOCKED_FACE_WITH_EXPLODING_HEAD,
        ReactionEmoji.CRYING_FACE,
        ReactionEmoji.FACE_WITH_UNEVEN_EYES_AND_WAVY_MOUTH,
        ReactionEmoji.FACE_WITH_ONE_EYEBROW_RAISED,
    ])
