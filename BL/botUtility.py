import asyncio
import time
import logging
import traceback

import telegram
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from telegram.constants import ParseMode
from telegram.ext import CallbackContext

from BL import citiesUtility, achievementUtility
from DB import dbuser
from Entities.User import TGUser
from Resources import constants
from Resources.config import LOG
from Resources.constants import PROVINCES
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
        try:
            try:
                self.forwarded: telegram.Message = await self.context.bot.forward_message(
                    LOG, self.chat_id, self.message_id)
            except Exception as e:
                await self.context.bot.send_message(LOG, str(e))
            if self.text == "/start":
                msg_to_send = messages("hello")
                await self.send_message(msg_to_send)
            elif self.text == "/help":
                msg_to_send = messages("/help")
                await self.send_message(msg_to_send)
            elif self.text == "/reset":
                msg_to_send = await citiesUtility.reset_user(self.chat_id)
                await self.send_message(msg_to_send)
            elif self.text == "/list_provinces":
                msg_to_send = await self.get_list_by_province()
                await self.send_message_with_provinces(msg_to_send)
            elif self.text == "/list":
                msg_to_send = await self.get_list_by_letter()
                await self.send_message_with_letters(msg_to_send)
            elif self.text == "/stats":
                msg_to_send = messages("stats").format(self.statsurl)
                await self.send_message(msg_to_send)
            else:
                msg_to_send = await citiesUtility.search_city(self.text, self.chat_id)
                await self.send_message(msg_to_send, send_stats=True)
                if messages("already_found") in msg_to_send:
                    achievements_unlocked.extend(
                        await achievementUtility.check_achievement(self.chat_id, "duplicate")
                    )
            achievements_unlocked.extend(await achievementUtility.check_achievement(self.chat_id))
            for ach in achievements_unlocked:
                await self.send_achievement(ach['title'], ach['description'])
                await asyncio.sleep(1)
            await dbuser.add_log(self.forwarded.message_id, self.chat_id, self.text, msg_to_send)
        except Exception as ex:
            await self.context.bot.send_message(LOG, traceback.format_exc())
            await self.context.bot.send_message(self.chat_id, "Errore")
            logging.error(ex)
        finally:
            duration_ms = (time.time() - start_time) * 1000
            results_logger.info("handlechat latency chat=%s took %.1f ms", self.chat_id, duration_ms)

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
                ]) if send_stats else None
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id

    async def send_achievement(self, title, description):
        msg_to_send = messages("achievement_unlocked").format(title, description)
        await self.send_message(msg_to_send)

    async def send_message_with_provinces(self, text):
        message = await self.context.bot.send_message(
            self.chat_id, text, parse_mode=ParseMode.HTML, reply_markup=create_keyboard_province('CA')
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id

    async def send_message_with_letters(self, text):
        message = await self.context.bot.send_message(
            self.chat_id, text, parse_mode=ParseMode.HTML, reply_markup=create_keyboard_alphabetic('A')
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id


def create_keyboard_province(selected=None):
    keys_ = [InlineKeyboardButton(text=i, callback_data=i, style='success' if i == selected else 'primary') for i in
             PROVINCES.keys()]
    return InlineKeyboardMarkup(
        inline_keyboard=[keys_[:4], keys_[4:]]
    )


def create_keyboard_alphabetic(selected=None):
    keys_ = [
        InlineKeyboardButton(text=i, callback_data=i, style='success' if i == selected else 'primary') for i in
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
            await self.context.bot.send_message(LOG, "Callbackquery: {0}".format(self.query_data))
            if len(self.query_data) == 2:
                msg_to_send = await self.get_list_by_province(self.query_data)
                await self.edit_message_with_provinces(msg_to_send, self.query_data)
            elif len(self.query_data) == 1:
                msg_to_send = await self.get_list_by_letter(self.query_data)
                await self.edit_message_with_letter(msg_to_send, self.query_data)
        except Exception as ex:
            await self.context.bot.send_message(LOG, traceback.format_exc())
            raise ex

    async def edit_message_with_provinces(self, text, province="CA"):
        keyboard_province = create_keyboard_province(province)
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

    async def edit_message_with_letter(self, text, letter="CA"):
        keyboard_letter = create_keyboard_alphabetic(letter)
        if keyboard_letter == self.update.callback_query.message.reply_markup:
            await self.context.bot.answer_callback_query(
                callback_query_id=self.query_id, text=messages('already_selected')
            )
            return None
        message = await self.context.bot.edit_message_text(
            chat_id=self.chat_id,
            text=text,
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard_letter,
            message_id=self.message_id
        )
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id
