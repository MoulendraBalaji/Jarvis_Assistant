from __future__ import annotations
import re
import uuid
import time
from typing import Any
from .base import BaseAgent, AgentMessage, AgentResponse
from ..db import db


class TaskAgent(BaseAgent):
    name = "task"
    description = "Manages task CRUD and natural language task creation"

    def _register_handlers(self) -> None:
        self.on("handle", self._handle)
        self.on("create", self._create)
        self.on("list", self._list)
        self.on("complete", self._complete)
        self.on("remove", self._remove)

    async def _handle(self, msg: AgentMessage) -> AgentResponse:
        text = msg.payload.get("text", "")
        intent = msg.payload.get("intent", "")
        params = msg.payload.get("params", {})

        if intent == "task.create" or "create" in intent.lower() or "add" in text.lower() or "remind" in text.lower():
            title = params.get("title") or self._extract_task_title(text)
            due_at = params.get("dueAt")
            if title:
                task = self._create_task(title, due_at)
                return AgentResponse(
                    source=self.name,
                    action="handle",
                    payload={
                        "intent": "task.create",
                        "answer": f"Task created: {title}",
                        "task": task,
                    },
                )
            return AgentResponse(
                source=self.name,
                action="handle",
                payload={
                    "intent": "task.create",
                    "answer": "What task would you like me to create?",
                },
            )

        if intent == "task.list" or "list" in text.lower() or "show" in text.lower():
            tasks = self._get_all_tasks()
            open_tasks = [t for t in tasks if not t.get("completed")]
            if not open_tasks:
                answer = "You have no open tasks. Nice work!"
            else:
                lines = [f"• {t['title']}" for t in open_tasks[:10]]
                answer = f"You have {len(open_tasks)} open tasks:\n" + "\n".join(lines)
            return AgentResponse(
                source=self.name,
                action="handle",
                payload={"intent": "task.list", "answer": answer},
            )

        return AgentResponse(
            source=self.name,
            action="handle",
            payload={
                "intent": "task",
                "answer": "I can help you create, list, or complete tasks. What would you like to do?",
            },
        )

    async def _create(self, msg: AgentMessage) -> AgentResponse:
        title = msg.payload.get("title", "")
        due_at = msg.payload.get("dueAt")
        if not title:
            return AgentResponse(source=self.name, action="create", success=False, error="Title required")
        task = self._create_task(title, due_at)
        return AgentResponse(source=self.name, action="create", payload={"task": task})

    async def _list(self, msg: AgentMessage) -> AgentResponse:
        return AgentResponse(
            source=self.name,
            action="list",
            payload={"tasks": self._get_all_tasks()},
        )

    async def _complete(self, msg: AgentMessage) -> AgentResponse:
        task_id = msg.payload.get("taskId", "")
        tasks = db.all("tasks")
        for t in tasks:
            if t["id"] == task_id:
                db.update("tasks", task_id, {"completed": 1})
                return AgentResponse(source=self.name, action="complete", payload={"ok": True})
        return AgentResponse(source=self.name, action="complete", success=False, error="Task not found")

    async def _remove(self, msg: AgentMessage) -> AgentResponse:
        task_id = msg.payload.get("taskId", "")
        db.remove("tasks", task_id)
        return AgentResponse(source=self.name, action="remove", payload={"ok": True})

    @staticmethod
    def _create_task(title: str, due_at: Any = None) -> dict:
        task = {
            "id": str(uuid.uuid4()),
            "title": title,
            "completed": 0,
            "createdAt": int(time.time() * 1000),
            "dueAt": due_at,
            "source": "agent",
            "tags": "[]",
        }
        db.insert("tasks", task)
        return task

    @staticmethod
    def _get_all_tasks() -> list[dict]:
        return db.all("tasks")

    @staticmethod
    def _extract_task_title(text: str) -> str:
        patterns = [
            r"(?:create|add|make|set|remind me (?:to)?)\s+(?:a\s+)?(?:task\s+(?:to\s+)?)?(.+)",
            r"todo:?\s+(.+)",
        ]
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return m.group(1).strip().rstrip(".")
        return text.strip()
