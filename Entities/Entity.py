from BL import utility
from Resources import constants


class Entity:
    def __init__(self):
        self.table = None
        self.pkey = None
        self.attr = [None]
        self.values = ()
        self.id = None

    def insert_query(self):
        if self.id:
            query = constants.insertquery.format(
                self.table,
                utility.create_string_format_numerate(len(self.attr)),
                str(tuple(self.attr)).replace("'", "")
            )
            query += constants.conflict + constants.onconstraint.format(self.pkey)
            query += constants.doupdate
            query += utility.create_string_format_key_pair(self.attr, skip=1)
            query = query.format(*self.values)
            return query.replace("'None'", 'null') + ";\n"
        return None
