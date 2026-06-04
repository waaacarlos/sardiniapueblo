import os
import sys

from dotenv import load_dotenv

load_dotenv()
ABS_FILE_PATH = os.path.dirname(__file__) + "/../"
TOKEN = sys.argv[1]
LOG = sys.argv[2]
ADMIN_CHATID = os.getenv("ADMIN_CHATID")
ENV = os.environ.get("ENV")
