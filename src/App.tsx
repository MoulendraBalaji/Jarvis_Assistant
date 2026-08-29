import React, { useState, useEffect } from "react";
import "./App.css";
import { TitleBar } from "./components/TitleBar";
import { AssistantOrb, OrbState } from "./components/AssistantOrb";
import { TaskBoard } from "./components/TaskBoard";
import { ChatPanel } from "./components/ChatPanel";
import { IntegrationsHealth } from "./components/IntegrationsHealth";
import { FocusGuardian } from "./components/FocusGuardian";
import { DailyBriefing } from "./components/DailyBriefing";
import { ProfileSettings } from "./components/ProfileSettings";
import { AssignmentFeed } from "./components/AssignmentFeed";
import { ConfigNotice } from "./components/ConfigNotice";
import { RecallPanel } from "./components/RecallPanel";
import { ScreenContext } from "./components/ScreenContext";
import { CommandPalette } from "./components/CommandPalette";
import { jarvis } from "./lib/jarvis";
import { useChat } from "./store/chat";
import { useUI, View } from "./store/ui";
import { VoiceState } from "../shared/types";

const NAV: { id: View; label: string }[] = [
  { id: "briefing", label: "Briefing" },
  { id: "tasks", label: "Tasks" },
  { id: "chat", label: "Chat" },
  { id: "recall", label: "Recall" },
  { id: "screen", label: "Screen" },
  { id: "integrations", label: "Sources" },
  { id: "focus", label: "Focus" },
  { id: "profile", label: "Profile" }
];

export default function App() {
  const view = useUI((s) => s.view);
  const setView = useUI((s) => s.setView);
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
      <div className="app__titlebar">
        <TitleBar />
      </div>
      <ConfigNotice />
      <div className="app__body">
        <aside className="app__rail">
          <AssistantOrb state={orb} size={84} onActivate={activate} />
          <nav className="app__nav">
            {NAV.map((n, idx) => (
              <button
                key={n.id}
                className={`app__navbtn ${view === n.id ? "app__navbtn--active" : ""}`}
                onClick={() => setView(n.id)}
                title={n.label}
              >
                <span className="app__nav-idx">{String(idx + 1).padStart(2, "0")}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="app__foot">v2 &#183; console</div>
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
          {view === "recall" && (
            <div className="app__grid app__grid--single">
              <RecallPanel />
            </div>
          )}
          {view === "screen" && (
            <div className="app__grid app__grid--single">
              <ScreenContext />
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
      <CommandPalette />
    </div>
  );
}
