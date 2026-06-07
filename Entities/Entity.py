import re


class Entity:
    def __init__(self):
        self.table = None
        self.pkey = None
        self.attr = []
        self.values = ()
        self.id = None

    @staticmethod
    def _validate_identifier(name: str) -> str:  # Check SQL Injection
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
            raise ValueError(f"Invalid SQL identifier: {name}")
        return name

    def insert_query(self):
        if not self.id:
            return None

        table = self._validate_identifier(self.table)
        pkey = self._validate_identifier(self.pkey)
        attrs = [self._validate_identifier(a) for a in self.attr]

        placeholders = ", ".join(f"${i}" for i in range(1, len(attrs) + 1))
        columns = ", ".join(attrs)

        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"

        updatable = attrs[1:]
        if updatable:
            update_set = ", ".join(f"{c} = EXCLUDED.{c}" for c in updatable)
            query += f" ON CONFLICT ON CONSTRAINT {pkey} DO UPDATE SET {update_set}"
        else:
            query += f" ON CONFLICT ON CONSTRAINT {pkey} DO NOTHING"

        return query, self.values
