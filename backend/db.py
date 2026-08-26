from __future__ import annotations
import json
import uuid
from pathlib import Path
from .config import DB_PATH


class _DBLayer:
    def __init__(self) -> None:
        self._path = DB_PATH
        self._data: dict[str, list[dict]] = {}
        self._load()

    def _load(self) -> None:
        if self._path.exists():
            try:
                self._data = json.loads(self._path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                self._data = {}
        else:
            self._data = {}

    def _save(self) -> None:
        self._path.write_text(json.dumps(self._data, indent=2, default=str), encoding="utf-8")

    def all(self, table: str) -> list[dict]:
        return list(self._data.get(table, []))

    def insert(self, table: str, record: dict) -> dict:
        if table not in self._data:
            self._data[table] = []
        if "id" not in record:
            record["id"] = str(uuid.uuid4())
        self._data[table].append(record)
        self._save()
        return record

    def update(self, table: str, record_id: str, patch: dict) -> dict | None:
        for rec in self._data.get(table, []):
            if rec.get("id") == record_id:
                rec.update(patch)
                self._save()
                return rec
        return None

    def remove(self, table: str, record_id: str) -> bool:
        records = self._data.get(table, [])
        before = len(records)
        self._data[table] = [r for r in records if r.get("id") != record_id]
        self._save()
        return len(self._data[table]) < before

    def gen_id(self) -> str:
        return str(uuid.uuid4())


db = _DBLayer()
