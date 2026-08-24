import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, clipboard } from "electron";
import * as path from "node:path";
import { initDb } from "./services/db";
import { registerIpc } from "./ipc";
import { startReminders } from "./services/scheduler";
import { deviceSync } from "./services/deviceSync";
import { overlay } from "./services/overlay";
import { voice } from "./services/voice/voice";
import { manualCaptureAdapter } from "./services/adapters/manualCaptureAdapter";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): BrowserWindow {
  const preloadPath = path.join(__dirname, "preload.cjs");

  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 880,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: "#e8ecf3",
    titleBarStyle: "hidden",
    resizable: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  overlay.setWindow(win);

  win.once("ready-to-show", () => {
    win.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Safety fallback to guarantee window visibility
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      win.show();
    }
  }, 1000);

  return win;
}

function createTray(): void {
  try {
    // Create 16x16 icon image buffer
    const icon = nativeImage.createFromBuffer(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVR42mNk+M9QzwAFjAwUBowGjAYyMDIwMDAwsDJiW4BsGg0fDR8NHw0fDR/qHgAAuV0K46aF1HkAAAAASUVORK5CYII=",
        "base64"
      )
    );

    tray = new Tray(icon);
    tray.setToolTip("JARVIS — Voice-locked AI Assistant");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Summon JARVIS",
        accelerator: "CmdOrCtrl+Shift+Space",
        click: () => overlay.summon()
      },
      {
        label: "Hide Overlay",
        click: () => overlay.dismiss()
      },
      { type: "separator" },
      {
        label: "Quick Capture Selected Text",
        accelerator: "CmdOrCtrl+Shift+J",
        click: () => {
          const text = clipboard.readText();
          if (text) manualCaptureAdapter.captureText(text);
        }
      },
      {
        label: "Toggle Voice Listening",
        type: "checkbox",
        checked: true,
        click: (item) => {
          if (item.checked) voice.start();
          else voice.stop();
        }
      },
      { type: "separator" },
      {
        label: "Quit JARVIS",
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => overlay.toggle());
  } catch {
    /* ignore tray creation errors in headless / CI */
  }
}

function registerGlobalHotkeys(): void {
  try {
    globalShortcut.register("CommandOrControl+Shift+Space", () => {
      overlay.toggle();
    });

    globalShortcut.register("Alt+J", () => {
      overlay.toggle();
    });

    globalShortcut.register("CommandOrControl+Shift+J", () => {
      const text = clipboard.readText();
      if (text && text.trim()) {
        manualCaptureAdapter.captureText(text);
      }
    });
  } catch {
    /* ignore shortcut collisions */
  }
}

app.whenReady().then(async () => {
  await initDb();
  const { notify } = registerIpc();
  mainWindow = createWindow();
  createTray();
  registerGlobalHotkeys();

  startReminders((title, body) => notify(title, body));
  void deviceSync.start();
  void voice.start();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  overlay.cleanup();
  if (tray) tray.destroy();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
