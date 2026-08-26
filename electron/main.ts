import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, clipboard, ipcMain } from "electron";
import * as path from "node:path";
import { ChildProcess, spawn } from "node:child_process";
import { registerIpc } from "./ipc";
import { startReminders } from "./services/scheduler";
import { deviceSync } from "./services/deviceSync";
import { overlay } from "./services/overlay";
import { voice } from "./services/voice/voice";
import { manualCaptureAdapter } from "./services/adapters/manualCaptureAdapter";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let pythonProcess: ChildProcess | null = null;

function startPythonBackend(): void {
  const backendDir = path.join(__dirname, "../backend");
  const isWin = process.platform === "win32";
  const cmd = isWin ? "python" : "python3";

  try {
    pythonProcess = spawn(cmd, ["-m", "uvicorn", "backend.server:app", "--host", "127.0.0.1", "--port", "8766"], {
      cwd: path.join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    pythonProcess.stdout?.on("data", (data: Buffer) => {
      console.log(`[Python Backend] ${data.toString().trim()}`);
    });

    pythonProcess.stderr?.on("data", (data: Buffer) => {
      console.log(`[Python Backend] ${data.toString().trim()}`);
    });

    pythonProcess.on("error", (err) => {
      console.warn("[Python Backend] Failed to start:", err.message);
      console.warn("[Python Backend] Ensure Python 3.10+ and pip dependencies are installed.");
    });

    pythonProcess.on("exit", (code) => {
      console.log(`[Python Backend] Exited with code ${code}`);
      pythonProcess = null;
    });
  } catch (err) {
    console.warn("[Python Backend] Spawn error:", err);
  }
}

function stopPythonBackend(): void {
  if (pythonProcess && !pythonProcess.killed) {
    pythonProcess.kill("SIGTERM");
    pythonProcess = null;
  }
}

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

  win.on("maximize", () => {
    win.webContents.send("window:maximized-change", true);
  });
  win.on("unmaximize", () => {
    win.webContents.send("window:maximized-change", false);
  });

  ipcMain.handle("window:minimize", () => {
    win.minimize();
  });
  ipcMain.handle("window:maximize", () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.handle("window:close", () => {
    win.close();
  });
  ipcMain.handle("window:isMaximized", () => {
    return win.isMaximized();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      win.show();
    }
  }, 1000);

  return win;
}

function createTray(): void {
  try {
    const icon = nativeImage.createFromBuffer(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVR42mNk+M9QzwAFjAwUBowGjAYyMDIwMDAwsDJiW4BsGg0fDR8NHw0fDR/qHgAAuV0K46aF1HkAAAAASUVORK5CYII=",
        "base64"
      )
    );

    tray = new Tray(icon);
    tray.setToolTip("JARVIS \u2014 Voice-locked AI Assistant");

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
  startPythonBackend();
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
  stopPythonBackend();
  globalShortcut.unregisterAll();
  overlay.cleanup();
  if (tray) tray.destroy();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
