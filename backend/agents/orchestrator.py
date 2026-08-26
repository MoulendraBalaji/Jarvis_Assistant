from __future__ import annotations
from typing import Any
from .base import AgentMessage, AgentResponse
from .coordinator import CoordinatorAgent
from .task_agent import TaskAgent
from .chat_agent import ChatAgent
from .memory_agent import MemoryAgent
from .briefing_agent import BriefingAgent


class Orchestrator:
    def __init__(self) -> None:
        self.coordinator = CoordinatorAgent()
        self.task_agent = TaskAgent()
        self.chat_agent = ChatAgent()
        self.memory_agent = MemoryAgent()
        self.briefing_agent = BriefingAgent()

        self.coordinator.register_agent(self.task_agent)
        self.coordinator.register_agent(self.chat_agent)
        self.coordinator.register_agent(self.memory_agent)
        self.coordinator.register_agent(self.briefing_agent)

    async def route(self, text: str, history: list[dict] | None = None, profile: dict | None = None) -> dict[str, Any]:
        intent = self._classify_intent(text)
        params = self._extract_params(text, intent)

        msg = AgentMessage(
            sender="electron",
            recipient="coordinator",
            action="route",
            payload={
                "text": text,
                "intent": intent,
                "params": params,
                "history": history or [],
                "profile": profile or {},
            },
        )
        response = await self.coordinator.handle(msg)
        return {
            "intent": intent,
            "params": params,
            "routedTo": "python",
            "answer": response.payload.get("answer", ""),
            "success": response.success,
        }

    async def execute(self, agent_name: str, action: str, payload: dict | None = None) -> AgentResponse:
        msg = AgentMessage(
            sender="electron",
            recipient=agent_name,
            action=action,
            payload=payload or {},
        )
        route_msg = AgentMessage(
            sender="electron",
            recipient="coordinator",
            action="route",
            payload={"target_agent": agent_name, "action": action, "payload": payload or {}},
        )
        return await self.coordinator.handle(route_msg)

    @staticmethod
    def _classify_intent(text: str) -> str:
        lower = text.lower()
        task_kw = ["task", "todo", "remind", "create", "add", "schedule", "deadline"]
        memory_kw = ["remember", "recall", "memory", "what do you know"]
        briefing_kw = ["briefing", "summary", "what's on", "what do i have", "morning"]
        if any(k in lower for k in task_kw):
            return "task.create"
        if any(k in lower for k in memory_kw):
            return "memory.store" if "remember" in lower else "memory.recall"
        if any(k in lower for k in briefing_kw):
            return "briefing.generate"
        return "chat"

    @staticmethod
    def _extract_params(text: str, intent: str) -> dict:
        params: dict = {}
        if intent == "task.create":
            import re
            m = re.search(r"(?:create|add|make|remind me (?:to)?)\s+(?:a\s+)?(?:task\s+(?:to\s+)?)?(.+)", text, re.IGNORECASE)
            if m:
                params["title"] = m.group(1).strip().rstrip(".")
        return params
