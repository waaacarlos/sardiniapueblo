import asyncio
import logging

from telegram import Update
from telegram.ext import MessageHandler, filters, ApplicationBuilder
from BL.botUtility import Message
from Resources.config import TOKEN, LOG
from Resources.logging_setup import setup_logging

from DB.dbservice import init_db


async def onchatmessage(update: Update, context):
    message = Message(update, context)
    await message.async_init()
    context.application.create_task(message.handlechat())


async def get_updates():
    setup_logging()
    await init_db()

    app = ApplicationBuilder().token(TOKEN).build()

    app.add_handler(MessageHandler(filters.TEXT, onchatmessage))

    await app.initialize()
    await app.start()

    logging.info("Bot started")

    await app.updater.start_polling()
    await asyncio.Event().wait()


if __name__ == '__main__':
    from telegram import Bot
    tg_bot = Bot(TOKEN)
    asyncio.run(tg_bot.send_message(LOG, "Avvio"))
    asyncio.run(get_updates())
