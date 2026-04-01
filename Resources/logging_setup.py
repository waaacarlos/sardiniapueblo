import logging
import os
import sys
import time
from logging.handlers import TimedRotatingFileHandler
from urllib import request, parse

from Resources import config


class TelegramErrorHandler(logging.Handler):
    def __init__(self, token: str, chat_id: str, level: int = logging.ERROR):
        super().__init__(level)
        self.token = token
        self.chat_id = chat_id
        self.api_url = f"https://api.telegram.org/bot{token}/sendMessage"

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            params = parse.urlencode({
                "chat_id": self.chat_id,
                "text": msg,
                # Avoid formatting issues; send plain text
                "disable_web_page_preview": True,
            })
            request.urlopen(f"{self.api_url}?{params}")
        except Exception:
            # Never raise from logging handler
            pass


def setup_logging(level: str | int = None) -> None:
    if getattr(setup_logging, "_configured", False):
        return

    log_level = level
    if isinstance(log_level, str):
        log_level = log_level.upper()
    try:
        numeric_level = getattr(logging, log_level) if isinstance(log_level, str) else int(log_level)
    except Exception:
        numeric_level = logging.INFO

    logger = logging.getLogger()
    logger.setLevel(numeric_level)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logger.handlers.clear()

    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    try:
        log_dir = os.path.join(config.ABS_FILE_PATH, "log")
        os.makedirs(log_dir, exist_ok=True)
        file_path = os.path.join(log_dir, "app.log")
        file_handler = TimedRotatingFileHandler(
            file_path,
            when="midnight",
            interval=1,
            backupCount=30,
            encoding="utf-8",
            utc=False
        )
        file_handler.suffix = "%Y-%m-%d"
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        # Dedicated results logger writing to daily file (compat with RESULT_LOG)
        results_logger = logging.getLogger("results")
        results_logger.setLevel(numeric_level)
        results_file_path = os.path.join(log_dir, f"QUERY_{time.strftime('%d-%m-%Y')}.log")
        results_handler = logging.FileHandler(results_file_path, encoding="utf-8")
        results_handler.setLevel(logging.INFO)
        results_handler.setFormatter(formatter)
        results_logger.handlers.clear()
        results_logger.addHandler(results_handler)
    except Exception:
        # If file handler fails (e.g., permissions), continue with console only
        pass

    # Telegram notifications for ERROR and above
    try:
        if config.TOKEN and config.LOG:
            tg_handler = TelegramErrorHandler(config.TOKEN, config.LOG, level=logging.ERROR)
            tg_handler.setFormatter(formatter)
            logger.addHandler(tg_handler)
    except Exception:
        pass

    # Log uncaught exceptions
    def _handle_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            # Allow default handling for KeyboardInterrupt
            return
        logging.getLogger(__name__).exception("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

    try:
        sys.excepthook = _handle_exception
    except Exception:
        pass

    setup_logging._configured = True
