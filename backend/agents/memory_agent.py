from __future__ import annotations
import uuid
import time
import math
from .base import BaseAgent, AgentMessage, AgentResponse
from ..db import db


class MemoryAgent(BaseAgent):
    name = "memory"
    description = "Vector-based memory recall with n-gram embeddings and cosine similarity"

    def __init__(self) -> None:
        self._dim = 64
        super().__init__()

    def _register_handlers(self) -> None:
        self.on("handle", self._handle)
        self.on("store", self._store)
        self.on("recall", self._recall)

    async def _handle(self, msg: AgentMessage) -> AgentResponse:
        text = msg.payload.get("text", "")
        lower = text.lower()
        if "remember" in lower:
            key = text.split("remember")[-1].strip().split("that")[-1].strip()
            key = key.rstrip(".")
            if key:
                self._save_fact(key, text)
                return AgentResponse(
                    source=self.name,
                    action="handle",
                    payload={"intent": "memory.store", "answer": f"Got it! I'll remember: {key}"},
                )
        return await self._recall_msg(text)

    async def _store(self, msg: AgentMessage) -> AgentResponse:
        key = msg.payload.get("key", "")
        value = msg.payload.get("value", "")
        if key:
            self._save_fact(key, value)
        return AgentResponse(source=self.name, action="store", payload={"ok": True})

    async def _recall(self, msg: AgentMessage) -> AgentResponse:
        text = msg.payload.get("text", "")
        return await self._recall_msg(text)

    async def _recall_msg(self, text: str) -> AgentResponse:
        facts = db.all("facts")
        if not facts:
            return AgentResponse(
                source=self.name, action="recall",
                payload={"answer": "I don't have any stored memories yet."},
            )
        query_vec = self._embed(text)
        scored = []
        for f in facts:
            fact_vec = self._embed(f.get("value", f.get("key", "")))
            sim = self._cosine(query_vec, fact_vec)
            scored.append((sim, f))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = [f for _, f in scored[:3] if _[0] > 0.3] if scored else []
        if not top:
            return AgentResponse(
                source=self.name, action="recall",
                payload={"answer": "I don't have anything stored about that yet."},
            )
        lines = [f"- {f['key']}: {f['value']}" for f in top]
        return AgentResponse(
            source=self.name, action="recall",
            payload={"answer": "Here's what I remember:\n" + "\n".join(lines)},
        )

    def _save_fact(self, key: str, value: str) -> None:
        facts = db.all("facts")
        for f in facts:
            if f.get("key") == key:
                db.update("facts", f["id"], {"value": value, "updatedAt": int(time.time() * 1000)})
                return
        db.insert("facts", {
            "id": str(uuid.uuid4()),
            "key": key,
            "value": value,
            "updatedAt": int(time.time() * 1000),
        })

    def _embed(self, text: str) -> list[float]:
        vec = [0.0] * self._dim
        words = text.lower().split()
        for w in words:
            for i in range(0, min(len(w), 12)):
                idx = (ord(w[i]) * 31 + i * 17) % self._dim
                vec[idx] += 1.0
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]

    @staticmethod
    def _cosine(a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a)) or 1.0
        nb = math.sqrt(sum(y * y for y in b)) or 1.0
        return dot / (na * nb)
