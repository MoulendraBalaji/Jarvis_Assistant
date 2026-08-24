import { spawn } from "node:child_process";
import * as os from "node:os";

const ALLOWLIST = ["chrome", "code", "notepad", "calculator", "spotify", "explorer", "finder", "terminal"];

export const uiAutomation = {
  isAllowed(target: string): boolean {
    return ALLOWLIST.some((a) => target.toLowerCase().includes(a));
  },

  open(target: string): { ok: boolean; reason?: string } {
    if (!this.isAllowed(target)) {
      return { ok: false, reason: `"${target}" is not on the automation allowlist.` };
    }
    const cmd = os.platform() === "win32" ? "start" : os.platform() === "darwin" ? "open" : "xdg-open";
    try {
      spawn(cmd, [target], { detached: true, stdio: "ignore" }).unref();
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: String(e) };
    }
  }
};
