import { BaseAdapter } from "./IngestAdapter";
import { healthMonitor } from "../healthMonitor";
import { deviceSync } from "../deviceSync";
import { dbLayer } from "../db";
import * as chrono from "chrono-node";

export class NotifMirrorAdapter extends BaseAdapter {
  id = "notif-mirror";
  label = "WhatsApp (Phone Mirror)";
  description = "Companion app mirror — streams mobile notifications over local WebSocket.";

  constructor() {
    super();
    deviceSync.on("notification-received", (notif: { packageName: string; title: string; text: string }) => {
      this.handleIncomingNotification(notif);
    });

    deviceSync.on("paired", () => {
      this.setStatus("healthy");
      this.lastSyncAt = Date.now();
      healthMonitor.update(this.id, {
        status: "healthy",
        lastSyncAt: this.lastSyncAt,
        errorMessage: undefined
      });
    });
  }

  async authorize() {
    if (!deviceSync.hasPairedDevice()) {
      this.setStatus("degraded");
      healthMonitor.update(this.id, {
        status: "degraded",
        errorMessage: `Open companion app and enter pairing code: ${deviceSync.getPairingCode()}`
      });
      return;
    }
    this.setStatus("healthy");
    healthMonitor.update(this.id, { status: "healthy" });
  }

  async connect() {
    if (!deviceSync.hasPairedDevice()) {
      this.setStatus("degraded");
      healthMonitor.update(this.id, {
        status: "degraded",
        errorMessage: "No companion phone connected. Pair in companion app."
      });
      return;
    }
    this.setStatus("healthy");
    this.lastSyncAt = Date.now();
    healthMonitor.update(this.id, { status: "healthy", lastSyncAt: this.lastSyncAt });
  }

  async reconnect() {
    await this.connect();
  }

  public handleIncomingNotification(notif: { packageName: string; title: string; text: string }) {
    const combined = `${notif.title} ${notif.text}`;
    const isTaskRelevant = /\b(assignment|due|deadline|submit|homework|presentation|quiz|exam|meeting|urgent)\b/i.test(combined);

    if (isTaskRelevant) {
      const parsed = chrono.parse(combined, new Date(), { forwardDate: true });
      const dueAt = parsed.length ? parsed[0].start.date().getTime() : null;

      dbLayer.insert("tasks", {
        id: dbLayer.genId(),
        createdAt: Date.now(),
        title: `[Phone: ${notif.title}] ${notif.text.slice(0, 120)}`,
        dueAt,
        completed: 0,
        source: this.id,
        recurring: null,
        tags: JSON.stringify(["phone_mirror", notif.packageName])
      });
    }

    this.lastSyncAt = Date.now();
    this.setStatus("healthy");
    healthMonitor.update(this.id, {
      status: "healthy",
      lastSyncAt: this.lastSyncAt
    });
  }
}

export const notifMirrorAdapter = new NotifMirrorAdapter();
