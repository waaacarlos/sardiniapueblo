import asyncio
import time
import logging
import traceback

import telegram
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from telegram.constants import ParseMode, ReactionEmoji
from telegram.ext import CallbackContext

from BL import citiesUtility, achievementUtility
from DB import dbuser
from Entities.User import TGUser
from Resources import constants, reactions
from Resources.config import LOG, ADMIN_CHATID
from Resources.constants import PROVINCES, SearchCase
from Resources.messages import messages

results_logger = logging.getLogger("results")


class Message:
    def __init__(self, update: Update, context):
        self.context = context
        self.msg = update
        self.chat_type = update.effective_chat.type
        self.chat_id = update.effective_chat.id
        self.message_id = update.effective_message.message_id
        self.text = update.effective_message.text
        self.statsurl = constants.STATSURL.format(update.effective_chat.id)
        self.rankurl = constants.RANKURL.format(update.effective_chat.id)
        self.forwarded = None

    async def async_init(self):
        await self.add_user()

    async def add_user(self):
        user = TGUser(self.msg.effective_user)
        await dbuser.insert_user_in_db(user)

    async def handlechat(self):
        start_time = time.time()
        achievements_unlocked = []
        _search_case = SearchCase.NONE
        try:
            try:
                self.forwarded: telegram.Message = await self.context.bot.forward_message(
                    LOG, self.chat_id, self.message_id)
            except Exception as e:
                await self.context.bot.send_message(LOG, str(e))
            await self.context.bot.send_chat_action(self.chat_id, "typing")
            if self.text == "/start":
                _search_case = SearchCase.START
                msg_to_send = messages("hello")
                await self.send_message(msg_to_send)
            elif self.text == "/help":
                msg_to_send = messages("/help")
                await self.send_message(msg_to_send)
            elif self.text == "/reset":
                await self.set_reaction(ReactionEmoji.MOYAI)
                msg_to_send = await citiesUtility.reset_user(self.chat_id)
                await self.send_message(msg_to_send)
                return
            elif self.text == "/list_provinces":
                _search_case = SearchCase.SEARCHING
                await self.set_reaction(reactions.searching())
                msg_to_send, _count = await self.get_list_by_province()
                m_id = await self.send_message_with_provinces(msg_to_send, _count)
                await self.context.bot.pin_chat_message(self.chat_id, m_id)
            elif self.text == "/list":
                _search_case = SearchCase.SEARCHING
                await self.set_reaction(reactions.searching())
                msg_to_send, found_number = await self.get_list_by_letter()
                m_id = await self.send_message_with_letters(msg_to_send, found_number)
                await self.context.bot.pin_chat_message(self.chat_id, m_id)
            elif self.text == "/stats":
                _search_case = SearchCase.SEARCHING
                await self.set_reaction(reactions.searching())
                msg_to_send = messages("stats").format(self.statsurl)
                await self.send_message(msg_to_send)
            elif self.text == "//":
                await self.set_reaction(ReactionEmoji.GRINNING_FACE_WITH_ONE_LARGE_AND_ONE_SMALL_EYE)
                raise NotImplementedError
            else:
                msg_to_send, _search_case = await citiesUtility.search_city(self.text, self.chat_id)
                await self.send_message(msg_to_send, send_stats=True)
                if _search_case == SearchCase.ALREADY_FOUND:
                    achievements_unlocked.extend(
                        await achievementUtility.check_achievement(self.chat_id, "duplicate")
                    )
                    await self.set_reaction(reactions.already_found())
                elif _search_case == SearchCase.NOT_FOUND:
                    await self.set_reaction(reactions.failure())
                elif _search_case == SearchCase.NEW_FOUND:
                    await self.set_reaction(reactions.success())
                else:
                    await self.set_reaction(reactions.almost())
            achievements_unlocked.extend(await achievementUtility.check_achievement(self.chat_id))
            if achievements_unlocked:
                ach_percentage = await achievementUtility.get_percentage_ach()
                for ach in achievements_unlocked:
                    await self.send_achievement(ach['title'], ach['description'], ach_percentage[ach['ach_key']])
                    await asyncio.sleep(0.5)
            try:
                await dbuser.add_log(
                    self.forwarded.message_id, self.chat_id, self.text, msg_to_send,
                    int(LOG.replace("-100", "")), _search_case.value
                )
            except Exception:
                logging.error(traceback.format_exc())
        except Exception as ex:
            await self.context.bot.send_message(LOG, traceback.format_exc())
            await self.context.bot.send_message(ADMIN_CHATID, traceback.format_exc())
            await self.context.bot.send_message(self.chat_id, "Errore")
            logging.error(ex)
        finally:
            duration_ms = (time.time() - start_time) * 1000
            results_logger.info("handlechat latency chat=%s took %.1f ms", self.chat_id, duration_ms)

    async def set_reaction(self, reaction):
        await self.context.bot.set_message_reaction(self.chat_id, self.message_id, reaction)

    async def get_list_by_province(self, province="CA"):
        return await citiesUtility.list_cities_by_prov(self.chat_id, province)

    async def get_list_by_letter(self, letter="A"):
        return await citiesUtility.list_cities_by_letter(self.chat_id, letter)

    async def send_message(self, text, send_stats=False):
        message = await self.context.bot.send_message(
            self.chat_id, text, parse_mode=ParseMode.HTML, reply_markup=InlineKeyboardMarkup(
                [
                    [
                        InlineKeyboardButton(text="Statistiche", web_app=WebAppInfo(self.statsurl)),
                        InlineKeyboardButton(text="Classifica", web_app=WebAppInfo(self.rankurl)),
                    ]
                ]) if send_stats else None,
            disable_web_page_preview=True,
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id

    async def send_achievement(self, title, description, percent):
        msg_to_send = messages("achievement_unlocked").format(title, description)
        perc_text = f"{"l'" if percent in (8, 11) else "il "}{percent}%"
        if percent < 25:
            msg_to_send += messages("ach_low_perc").format(perc_text)
        elif percent < 50:
            msg_to_send += messages("ach_perc").format(perc_text.capitalize())
        await self.send_message(msg_to_send)

    async def send_message_with_provinces(self, text, _count):
        message = await self.context.bot.send_message(
            self.chat_id, text, parse_mode=ParseMode.HTML,
            reply_markup=await self.create_keyboard_province('CA', _count)
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id

    async def send_message_with_letters(self, text, found_number):
        message = await self.context.bot.send_message(
            self.chat_id, text, parse_mode=ParseMode.HTML,
            reply_markup=await self.create_keyboard_alphabetic('A', found_number)
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id

    async def create_keyboard_province(self, selected=None, found_number=-1):
        prov_completed = await dbuser.get_province_completed(self.chat_id)
        keys_ = [
            InlineKeyboardButton(
                text=i,
                callback_data=f"{i};{found_number if i == selected else -1}",
                style='primary' if i == selected else 'success' if i in prov_completed else '')
            for i in PROVINCES.keys()]
        return InlineKeyboardMarkup(
            inline_keyboard=[keys_[:4], keys_[4:]]
        )

    async def create_keyboard_alphabetic(self, selected=None, found_number=-1):
        letters_completed = await dbuser.get_letters_completed(self.chat_id)
        keys_ = [
            InlineKeyboardButton(
                text=i,
                callback_data=f"{i};{found_number if i == selected else -1}",
                style='primary' if i == selected else 'success' if i in letters_completed else '')
            for i in
            [
                     'A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'L',
                     'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Z'
            ]
        ]
        return InlineKeyboardMarkup(
            inline_keyboard=[keys_[:7], keys_[7:14], keys_[14:]]
        )


class AnswerQuery(Message):
    def __init__(self, update: Update, context: CallbackContext, queryid=None, querydata=None):
        super(AnswerQuery, self).__init__(update, context)
        self.query_id = int(queryid or update.callback_query.id)
        self.query_data = querydata or update.callback_query.data
        self.update = update

    async def handlecallback(self):
        try:
            await self.context.bot.send_message(
                LOG,
                f"Da: ({self.chat_id}) {self.msg.effective_user.full_name}\nCallbackquery: {self.query_data}"
            )
            _querydata = self.query_data.split(";")
            _value = _querydata[0]
            _count = -1
            if len(_querydata) == 2:
                _count = int(_querydata[1])

            if len(_value) == 2:
                msg_to_send, _newCount = await self.get_list_by_province(_value)
                if _newCount == _count:
                    await self.context.bot.answer_callback_query(self.query_id, messages("already_selected"))
                    return None
                await self.edit_message_with_provinces(msg_to_send, _value, _newCount)
            elif len(_value) == 1:
                msg_to_send, _newCount = await self.get_list_by_letter(_value)
                if _newCount == _count:
                    await self.context.bot.answer_callback_query(self.query_id, messages("already_selected"))
                    return None
                await self.edit_message_with_letter(msg_to_send, _value, _newCount)
        except Exception as ex:
            await self.context.bot.send_message(LOG, traceback.format_exc())
            raise ex

    async def edit_message_with_provinces(self, text, province="CA", count=-1):
        keyboard_province = await self.create_keyboard_province(province, count)
        if keyboard_province == self.update.callback_query.message.reply_markup:
            await self.context.bot.answer_callback_query(
                callback_query_id=self.query_id, text=messages('already_selected')
            )
            return None
        message = await self.context.bot.edit_message_text(
            chat_id=self.chat_id,
            text=text,
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard_province,
            message_id=self.message_id
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id

    async def edit_message_with_letter(self, text, letter="A", count=-1):
        keyboard_letter = await self.create_keyboard_alphabetic(letter, count)
        message = await self.context.bot.edit_message_text(
            chat_id=self.chat_id,
            text=text,
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard_letter,
            message_id=self.message_id
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id
