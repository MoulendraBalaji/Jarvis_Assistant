import React, { useEffect, useState } from "react";
import { ClayCard, ClayButton, ClayInput, ClayToggle, ClayBadge } from "../design-system";
import { useProfile } from "../store/profile";
import { useVoice } from "../store/voice";
import { jarvis } from "../lib/jarvis";
import { DeviceSyncStatus, VoiceEnrollmentProgress, VoiceStatus } from "../../shared/types";

export function ProfileSettings() {
  const { profile, load, set, deleteFact } = useProfile();
  const voice = useVoice();
  const [style, setStyle] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<DeviceSyncStatus | null>(null);
  const [enrollProgress, setEnrollProgress] = useState<VoiceEnrollmentProgress | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    load();
    voice.load();
    loadVoiceAndSync();

    const unsubVoice = jarvis.onEvent("voice:enroll-progress", (p: VoiceEnrollmentProgress) => {
      setEnrollProgress(p);
      if (p.status === "completed" || p.status === "failed") {
        setEnrolling(false);
        loadVoiceAndSync();
      }
    });

    const unsubSync = jarvis.onEvent("sync:paired", () => {
      loadVoiceAndSync();
    });

    return () => {
      unsubVoice();
      unsubSync();
    };
  }, [load]);

  useEffect(() => {
    if (profile) setStyle(profile.phrasingStyle);
  }, [profile]);

  const loadVoiceAndSync = async () => {
    try {
      const vs = await jarvis.voice.getStatus();
      setVoiceStatus(vs);
      const ss = await jarvis.sync.getStatus();
      setSyncStatus(ss);
    } catch {
      /* ignore */
    }
  };

  const handleEnrollVoice = async () => {
    setEnrolling(true);
    setEnrollProgress({
      currentSample: 0,
      totalSamples: 8,
      status: "capturing",
      message: "Starting voice enrollment. Speak 'Hey JARVIS' clearly..."
    });
    try {
      await jarvis.voice.enroll();
    } catch {
      setEnrolling(false);
    }
  };

  const handleRegenerateCode = async () => {
    try {
      const code = await jarvis.sync.regenerateCode();
      if (syncStatus) setSyncStatus({ ...syncStatus, pairingCode: code });
    } catch {
      /* ignore */
    }
  };

  if (!profile) return <ClayCard>Loading profile…</ClayCard>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ClayCard large>
        <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Personalization & Preferences</h2>
        <p style={{ fontSize: 12, color: "var(--clay-text-muted)", marginTop: 0 }}>
          Everything JARVIS has learned — fully editable and transparent. Nothing opaque.
        </p>

        <label style={{ fontSize: 13, fontWeight: 600 }}>Phrasing style</label>
        <div style={{ display: "flex", gap: 10, marginTop: 8, marginBottom: 16 }}>
          <ClayInput value={style} onChange={(e) => setStyle(e.target.value)} />
          <ClayButton variant="primary" onClick={() => set({ phrasingStyle: style })}>Save</ClayButton>
        </div>

        <label style={{ fontSize: 13, fontWeight: 600 }}>Active hours</label>
        <p style={{ fontSize: 12, color: "var(--clay-text-muted)" }}>
          {profile.activeHours.start}:00 – {profile.activeHours.end}:00 (Notifications are automatically suppressed outside these hours)
        </p>

        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Learned facts & memory</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {profile.learnedFacts.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--clay-text-muted)" }}>No facts learned yet. Say "remember that..." to store memories.</span>
          )}
          {profile.learnedFacts.map((f) => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 14, boxShadow: "var(--clay-shadow-raised-sm)" }}>
              <span style={{ fontSize: 13 }}><strong>{f.key}</strong>: {f.value}</span>
              <button onClick={() => deleteFact(f.key)} style={{ border: "none", background: "transparent", color: "#c15050", cursor: "pointer" }}>🗑</button>
            </div>
          ))}
        </div>
      </ClayCard>

      <ClayCard large>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>🎙️ Voice-Lock & Speaker Verification</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--clay-text-muted)" }}>
              Eagle acoustic voiceprint. Rejects unauthorized voices and responds exclusively to your biometric profile.
            </p>
          </div>
          <ClayBadge status={voiceStatus?.enrolled ? "healthy" : "unauthenticated"}>
            {voiceStatus?.enrolled ? "Voice-Locked" : "Not Enrolled"}
          </ClayBadge>
        </div>

        {enrollProgress && (
          <div style={{ padding: "12px 14px", borderRadius: 14, boxShadow: "var(--clay-shadow-pressed)", marginBottom: 14, background: "rgba(138, 160, 240, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span>{enrollProgress.message}</span>
              <strong>Sample {enrollProgress.currentSample} / {enrollProgress.totalSamples}</strong>
            </div>
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(enrollProgress.currentSample / enrollProgress.totalSamples) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #8aa0f0, #6c82db)",
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <ClayButton variant="primary" onClick={handleEnrollVoice} disabled={enrolling}>
            {enrolling ? "Capturing Voice..." : voiceStatus?.enrolled ? "Re-enroll Voiceprint" : "Enroll Voiceprint"}
          </ClayButton>
          <ClayButton variant="ghost" onClick={() => jarvis.voice.speak("JARVIS voice synthesizer online and ready.")}>
            Test Speech (TTS)
          </ClayButton>
        </div>

        <div className="console-row" style={{ marginTop: 16, justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12 }}>Automatic listening (wake word)</div>
            <div style={{ fontSize: 11, color: "var(--console-text-muted)" }}>
              state: {voice.status?.state ?? "\u2026"}
              {voice.status?.accessKeyConfigured ? "" : " · no Picovoice key, simulated"}
            </div>
          </div>
          <ClayToggle
            on={voice.listening}
            onChange={() => voice.setListening(!voice.listening)}
            aria-label="Toggle automatic voice listening"
          />
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--console-text-muted)" }}>
          When the loop is on, JARVIS listens for its wake word continuously and reacts to
          triggers reactively. Turn it off to make listening fully manual again.
        </p>
      </ClayCard>

      <ClayCard large>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>📱 Phone Companion & Local LAN Sync</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--clay-text-muted)" }}>
              Pair your React Native Expo companion app to mirror WhatsApp notifications and quick captures.
            </p>
          </div>
          <ClayBadge status={syncStatus?.paired ? "healthy" : "unauthenticated"}>
            {syncStatus?.paired ? "Paired" : "Awaiting Pairing"}
          </ClayBadge>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", borderRadius: 14, boxShadow: "var(--clay-shadow-raised-sm)", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--clay-text-muted)" }}>6-DIGIT PAIRING PIN</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#4f69db" }}>
              {syncStatus?.pairingCode || "------"}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--clay-text-muted)", flex: 1 }}>
            Enter this PIN in the companion app on your phone while connected to the same Wi-Fi network. Port: {syncStatus?.serverPort || 8765}
          </div>
          <ClayButton variant="ghost" onClick={handleRegenerateCode}>
            New PIN
          </ClayButton>
        </div>
      </ClayCard>
    </div>
  );
}
