from __future__ import annotations
from .base import BaseAgent, AgentMessage, AgentResponse
from ..db import db


class BriefingAgent(BaseAgent):
    name = "briefing"
    description = "Generates daily briefings from tasks, assignments, and stored memory"

    def _register_handlers(self) -> None:
        self.on("handle", self._handle)
        self.on("generate", self._generate)

    async def _handle(self, msg: AgentMessage) -> AgentResponse:
        return await self._generate(msg)

    async def _generate(self, msg: AgentMessage) -> AgentResponse:
        tasks = db.all("tasks")
        assignments = db.all("assignments")
        items = []
        for t in tasks:
            if not t.get("completed"):
                items.append({
                    "kind": "task",
                    "title": t.get("title", ""),
                    "dueAt": t.get("dueAt"),
                })
        for a in assignments:
            items.append({
                "kind": "assignment",
                "title": f"{a.get('course', '')}: {a.get('title', '')}",
                "dueAt": a.get("dueAt"),
            })
        return AgentResponse(
            source=self.name,
            action="generate",
            payload={"items": items},
        )
