import time
import logging
import traceback

from telegram import Update
from telegram.constants import ParseMode

from DB import dbuser
from Entities.User import TGUser
from Resources.config import LOG
from BL import citiesUtility


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
            city = await citiesUtility.found_city(self.text)
            if city:
                logging.info(f"Found city: {city['id']}")
                result = await citiesUtility.add_city(city['id'], self.chat_id)
                if result:
                    await self.send_message(f"<b>{city['nome']} aggiunto!</b>")
                else:
                    await self.send_message("Già inserito")
            else:
                await self.send_message("Not Found")
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
