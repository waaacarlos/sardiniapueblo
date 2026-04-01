from telegram import User

from Entities.Entity import Entity


class TGUser(Entity):
    def __init__(self, user: User):
        super().__init__()
        self.table = "users"
        self.pkey = "users_pkey"
        self.attr = [
            "id",
            "firstname",
            "fullname",
            "language",
            "lastname",
            "username"
        ]
        self.id = user.id
        self.firstname = user.first_name
        self.fullname = user.full_name
        self.language = user.language_code
        self.lastname = user.last_name
        self.username = user.username
        self.values = (
            self.id,
            self.firstname,
            self.fullname,
            self.language,
            self.lastname,
            self.username
        )
