import React, { useState, useEffect } from "react";
import "./App.css";
import { AssistantOrb, OrbState } from "./components/AssistantOrb";
import { TaskBoard } from "./components/TaskBoard";
import { ChatPanel } from "./components/ChatPanel";
import { IntegrationsHealth } from "./components/IntegrationsHealth";
import { FocusGuardian } from "./components/FocusGuardian";
import { DailyBriefing } from "./components/DailyBriefing";
import { ProfileSettings } from "./components/ProfileSettings";
import { AssignmentFeed } from "./components/AssignmentFeed";
import { jarvis } from "./lib/jarvis";
import { useChat } from "./store/chat";
import { VoiceState } from "../shared/types";

type View = "briefing" | "tasks" | "chat" | "integrations" | "focus" | "profile";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "briefing", label: "Briefing", icon: "☀️" },
  { id: "tasks", label: "Tasks", icon: "✅" },
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "integrations", label: "Sources", icon: "🔌" },
  { id: "focus", label: "Focus", icon: "🎯" },
  { id: "profile", label: "Profile", icon: "🧠" }
];

export default function App() {
  const [view, setView] = useState<View>("briefing");
  const [orb, setOrb] = useState<OrbState>("idle");
  const send = useChat((s) => s.send);

  useEffect(() => {
    const unsub = jarvis.onEvent("voice:state-change", (voiceState: VoiceState) => {
      if (voiceState === "listening" || voiceState === "enrolling") {
        setOrb("listening");
      } else if (voiceState === "verifying" || voiceState === "processing") {
        setOrb("thinking");
      } else if (voiceState === "speaking") {
        setOrb("speaking");
      } else {
        setOrb("idle");
      }
    });

    const unsubTranscript = jarvis.onEvent("voice:transcript", (text: string) => {
      send(text);
    });

    return () => {
      unsub();
      unsubTranscript();
    };
  }, [send]);

  const activate = () => {
    setOrb("listening");
    setTimeout(() => setOrb("thinking"), 800);
    setTimeout(() => {
      setOrb("idle");
      send("What's on my plate today?");
    }, 1600);
  };

  return (
    <div className="app">
      <aside className="app__rail">
        <AssistantOrb state={orb} size={84} onActivate={activate} />
        <nav className="app__nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`app__navbtn ${view === n.id ? "app__navbtn--active" : ""}`}
              onClick={() => setView(n.id)}
              title={n.label}
            >
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span style={{ fontSize: 11 }}>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", fontSize: 10, color: "var(--clay-text-muted)", textAlign: "center" }}>
          voice-locked
        </div>
      </aside>

      <main className="app__main">
        {view === "briefing" && (
          <div className="app__grid">
            <DailyBriefing />
            <AssignmentFeed />
            <FocusGuardian />
          </div>
        )}
        {view === "tasks" && (
          <div className="app__grid">
            <TaskBoard />
            <IntegrationsHealth />
          </div>
        )}
        {view === "chat" && (
          <div className="app__grid app__grid--single">
            <ChatPanel />
          </div>
        )}
        {view === "integrations" && (
          <div className="app__grid">
            <IntegrationsHealth />
            <AssignmentFeed />
          </div>
        )}
        {view === "focus" && (
          <div className="app__grid app__grid--single">
            <FocusGuardian />
          </div>
        )}
        {view === "profile" && (
          <div className="app__grid app__grid--single">
            <ProfileSettings />
          </div>
        )}
      </main>
    </div>
  );
}
