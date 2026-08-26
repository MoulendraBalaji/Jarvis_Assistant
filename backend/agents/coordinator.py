from __future__ import annotations
from typing import Any
from .base import BaseAgent, AgentMessage, AgentResponse


class CoordinatorAgent(BaseAgent):
    name = "coordinator"
    description = "Routes messages to the correct agent based on intent and context"

    def __init__(self) -> None:
        self._agent_registry: dict[str, BaseAgent] = {}
        super().__init__()

    def register_agent(self, agent: BaseAgent) -> None:
        self._agent_registry[agent.name] = agent

    def _register_handlers(self) -> None:
        self.on("route", self._handle_route)
        self.on("list_agents", self._handle_list_agents)

    async def _handle_route(self, msg: AgentMessage) -> AgentResponse:
        target = msg.payload.get("target_agent", "")
        if target and target in self._agent_registry:
            agent = self._agent_registry[target]
            inner = AgentMessage(
                sender=msg.sender,
                recipient=target,
                action=msg.payload.get("action", "handle"),
                payload=msg.payload.get("payload", {}),
            )
            return await agent.handle(inner)

        intent = msg.payload.get("intent", "")
        mapped = self._map_intent(intent)
        if mapped and mapped in self._agent_registry:
            agent = self._agent_registry[mapped]
            inner = AgentMessage(
                sender=msg.sender,
                recipient=mapped,
                action="handle",
                payload={
                    "text": msg.payload.get("text", ""),
                    "intent": intent,
                    "params": msg.payload.get("params", {}),
                    "history": msg.payload.get("history", []),
                    "profile": msg.payload.get("profile", {}),
                },
            )
            return await agent.handle(inner)

        return AgentResponse(
            source=self.name,
            action="route",
            success=False,
            error=f"No agent found for intent: {intent}",
        )

    async def _handle_list_agents(self, msg: AgentMessage) -> AgentResponse:
        agents_info = [
            {"name": a.name, "description": a.description, "actions": a.list_actions()}
            for a in self._agent_registry.values()
        ]
        return AgentResponse(
            source=self.name,
            action="list_agents",
            payload={"agents": agents_info},
        )

    @staticmethod
    def _map_intent(intent: str) -> str | None:
        mapping: dict[str, str] = {
            "task.create": "task",
            "task.list": "task",
            "task.complete": "task",
            "task.remove": "task",
            "chat": "chat",
            "memory.store": "memory",
            "memory.recall": "memory",
            "briefing.generate": "briefing",
        }
        return mapping.get(intent)
