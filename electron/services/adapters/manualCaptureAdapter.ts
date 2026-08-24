import { BaseAdapter } from "./IngestAdapter";
import { healthMonitor } from "../healthMonitor";
import { dbLayer } from "../db";
import { Task } from "../../../shared/types";
import * as chrono from "chrono-node";

export class ManualCaptureAdapter extends BaseAdapter {
  id = "manual-capture";
  label = "Manual Capture";
  description = "Global hotkey & quick text input — capture selected text anywhere as a task.";
  private hotkey = "CommandOrControl+Shift+J";

  async authorize() {
    await this.connect();
  }

  async connect() {
    this.setStatus("healthy");
    this.lastSyncAt = Date.now();
    healthMonitor.update(this.id, { status: "healthy", lastSyncAt: this.lastSyncAt });
  }

  async reconnect() {
    await this.connect();
  }

  public getHotkey(): string {
    return this.hotkey;
  }

  async captureText(text: string): Promise<Task> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Empty text provided for capture");

    const parsed = chrono.parse(trimmed, new Date(), { forwardDate: true });
    const dueAt = parsed.length ? parsed[0].start.date().getTime() : null;

    const task = dbLayer.insert("tasks", {
      id: dbLayer.genId(),
      createdAt: Date.now(),
      title: trimmed.slice(0, 200),
      dueAt,
      completed: 0,
      source: this.id,
      recurring: null,
      tags: JSON.stringify(["quick_capture"])
    }) as unknown as Task;

    this.lastSyncAt = Date.now();
    healthMonitor.update(this.id, { status: "healthy", lastSyncAt: this.lastSyncAt });
    return task;
  }
}

export const manualCaptureAdapter = new ManualCaptureAdapter();
