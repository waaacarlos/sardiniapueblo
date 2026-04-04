import time
import logging
import traceback

from telegram import Update
from telegram.constants import ParseMode

from BL import citiesUtility
from DB import dbuser
from Entities.User import TGUser
from Resources.config import LOG
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

    async def async_init(self):
        await self.add_user()

    async def add_user(self):
        user = TGUser(self.msg.effective_user)
        await dbuser.insert_user_in_db(user)

    async def handlechat(self):
        start_time = time.time()
        try:
            try:
                await self.context.bot.forward_message(LOG, self.chat_id, self.message_id)
            except Exception as e:
                await self.context.bot.send_message(LOG, str(e))
            if self.text == "/start":
                await self.send_message(messages("hello"))
            elif self.text == "/help":
                await self.send_message(messages("help"))
            elif self.text == "/reset":
                msg_to_send = await citiesUtility.reset_user(self.chat_id)
                await self.send_message(msg_to_send)
            elif self.text == "/list":
                msg_to_send = await citiesUtility.list_cities(self.chat_id)
                await self.send_message(msg_to_send)
            else:
                msg_to_send = await citiesUtility.search_city(self.text, self.chat_id)
                await self.send_message(msg_to_send)
        except Exception as ex:
            await self.context.bot.send_message(LOG, traceback.format_exc())
            await self.context.bot.send_message(self.chat_id, "Errore")
            logging.error(ex)
        finally:
            duration_ms = (time.time() - start_time) * 1000
            results_logger.info("handlechat latency chat=%s took %.1f ms", self.chat_id, duration_ms)

    async def send_message(self, text):
        message = await self.context.bot.send_message(self.chat_id, text, parse_mode=ParseMode.HTML)
        await self.context.bot.forward_message(LOG, self.chat_id, message.message_id)
        return message.message_id
