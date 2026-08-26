from __future__ import annotations
import time
import uuid
from typing import Any, Callable, Awaitable
from pydantic import BaseModel


class AgentMessage(BaseModel):
    id: str = ""
    sender: str
    recipient: str = "coordinator"
    action: str
    payload: dict[str, Any] = {}
    timestamp: float = 0.0

    def model_post_init(self, __context: Any) -> None:
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.timestamp:
            self.timestamp = time.time()


class AgentResponse(BaseModel):
    id: str = ""
    source: str
    action: str
    payload: dict[str, Any] = {}
    success: bool = True
    error: str | None = None
    timestamp: float = 0.0

    def model_post_init(self, __context: Any) -> None:
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.timestamp:
            self.timestamp = time.time()


HandlerFunc = Callable[[AgentMessage], Awaitable[AgentResponse]]


class BaseAgent:
    name: str = "base"
    description: str = "Base agent"

    def __init__(self) -> None:
        self._handlers: dict[str, HandlerFunc] = {}
        self._register_handlers()

    def _register_handlers(self) -> None:
        pass

    def on(self, action: str, handler: HandlerFunc) -> None:
        self._handlers[action] = handler

    async def handle(self, message: AgentMessage) -> AgentResponse:
        handler = self._handlers.get(message.action)
        if not handler:
            return AgentResponse(
                source=self.name,
                action=message.action,
                success=False,
                error=f"Unknown action: {message.action}",
            )
        try:
            return await handler(message)
        except Exception as exc:
            return AgentResponse(
                source=self.name,
                action=message.action,
                success=False,
                error=str(exc),
            )

    def list_actions(self) -> list[str]:
        return list(self._handlers.keys())
