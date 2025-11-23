// @ts-nocheck
// Use CommonJS require for Electron to ensure proper import
const {
  app,
  BrowserWindow,
  Menu,
  shell,
  ipcMain,
  dialog,
} = require("electron");
const path = require("node:path");
const url = require("node:url");

// __filename and __dirname are available globally in CommonJS

// Handle app command line arguments
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private isDevelopment = process.env.NODE_ENV === "development";

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    // App event handlers
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIpcHandlers();
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // Security: Prevent new window creation
    app.on("web-contents-created", (_, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
      });

      // Development: Allow hot reload
      if (this.isDevelopment) {
        contents.openDevTools();
      }
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        webSecurity: !this.isDevelopment,
      },
      icon: this.getIconPath(),
      show: false, // Don't show until ready-to-show
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
      autoHideMenuBar: !this.isDevelopment,
    });

    // Load the appropriate URL
    if (this.isDevelopment) {
      this.loadDevelopmentURL();
    } else {
      this.loadProductionURL();
    }

    // Window event handlers
    this.mainWindow.once("ready-to-show", () => {
      if (this.mainWindow) {
        this.mainWindow.show();
      }

      if (this.isDevelopment && this.mainWindow) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  }

  private loadDevelopmentURL(): void {
    const PORT = process.env.PORT || 3000;
    const devServerURL = `http://localhost:${PORT}`;

    this.mainWindow?.loadURL(devServerURL);

    // Wait for Next.js dev server to be ready
    this.waitForServer(devServerURL).catch((error) => {
      console.error("Failed to load development URL:", error);
    });
  }

  private loadProductionURL(): void {
    const startPath = path.join(__dirname, "../build/index.html");
    this.mainWindow?.loadFile(startPath);
  }

  private async waitForServer(url: string): Promise<void> {
    const maxAttempts = 60; // 30 seconds max wait
    const attemptDelay = 500; // 500ms between attempts

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ Development server ready at ${url}`);
          return;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, attemptDelay));
    }

    throw new Error(
      `Development server did not start within ${maxAttempts * attemptDelay}ms`,
    );
  }

  private getIconPath(): string {
    const platform = process.platform;

    switch (platform) {
      case "win32":
        return path.join(__dirname, "../src/app/favicon.ico");
      case "darwin":
        return path.join(__dirname, "../src/app/favicon.ico");
      default:
        return path.join(__dirname, "../src/app/opengraph-image.png");
    }
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: "File",
        submenu: [
          {
            label: "New Project",
            accelerator: "CmdOrCtrl+N",
            click: () => {
              // Handle new project
            },
          },
          {
            label: "Open Project",
            accelerator: "CmdOrCtrl+O",
            click: async () => {
              if (this.mainWindow) {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                  properties: ["openFile"],
                  filters: [{ name: "Video Projects", extensions: ["json"] }],
                });

                if (!result.canceled) {
                  // Handle project opening
                }
              }
            },
          },
          { type: "separator" },
          {
            label: "Export Video",
            accelerator: "CmdOrCtrl+E",
            click: () => {
              // Handle export
            },
          },
          { type: "separator" },
          {
            label: "Exit",
            accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        ],
      },
      {
        label: "View",
        submenu: [
          { label: "Reload", accelerator: "CmdOrCtrl+R", role: "reload" },
          {
            label: "Force Reload",
            accelerator: "CmdOrCtrl+Shift+R",
            role: "forceReload",
          },
          {
            label: "Toggle Developer Tools",
            accelerator: "F12",
            role: "toggleDevTools",
          },
          { type: "separator" },
          {
            label: "Actual Size",
            accelerator: "CmdOrCtrl+0",
            role: "resetZoom",
          },
          { label: "Zoom In", accelerator: "CmdOrCtrl+Plus", role: "zoomIn" },
          { label: "Zoom Out", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
          { type: "separator" },
          {
            label: "Toggle Fullscreen",
            accelerator: "F11",
            role: "togglefullscreen",
          },
        ],
      },
      {
        label: "Window",
        submenu: [
          { label: "Minimize", accelerator: "CmdOrCtrl+M", role: "minimize" },
          { label: "Close", accelerator: "CmdOrCtrl+W", role: "close" },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "About",
            click: () => {
              if (this.mainWindow) {
                dialog.showMessageBox(this.mainWindow, {
                  type: "info",
                  title: "About Video Studio",
                  message: "Video Studio",
                  detail: `Version ${app.getVersion()}\nA powerful video editing application built with Next.js and Electron.`,
                });
              }
            },
          },
          {
            label: "Learn More",
            click: () => {
              shell.openExternal(
                "https://github.com/your-repo/video-starter-kit",
              );
            },
          },
        ],
      },
    ];

    // macOS specific menu adjustments
    if (process.platform === "darwin") {
      template.unshift({
        label: app.getName(),
        submenu: [
          { label: `About ${app.getName()}`, role: "about" },
          { type: "separator" },
          { label: "Services", role: "services", submenu: [] },
          { type: "separator" },
          {
            label: `Hide ${app.getName()}`,
            accelerator: "Command+H",
            role: "hide",
          },
          {
            label: "Hide Others",
            accelerator: "Command+Shift+H",
            role: "hideOthers",
          },
          { label: "Show All", role: "unhide" },
          { type: "separator" },
          { label: "Quit", accelerator: "Command+Q", click: () => app.quit() },
        ],
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // App information
    ipcMain.handle("app/getVersion", () => {
      return app.getVersion();
    });

    ipcMain.handle("app/getName", () => {
      return app.getName();
    });

    // File operations
    ipcMain.handle("dialog/showOpenDialog", async (_, options) => {
      if (this.mainWindow) {
        const result = await dialog.showOpenDialog(this.mainWindow, options);
        return result;
      }
      return { canceled: true, filePaths: [] };
    });

    ipcMain.handle("dialog/showSaveDialog", async (_, options) => {
      if (this.mainWindow) {
        const result = await dialog.showSaveDialog(this.mainWindow, options);
        return result;
      }
      return { canceled: true, filePath: undefined };
    });

    ipcMain.handle("shell/openExternal", async (_, url) => {
      await shell.openExternal(url);
    });

    // Window controls
    ipcMain.handle("window/minimize", () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle("window/maximize", () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle("window/close", () => {
      this.mainWindow?.close();
    });
  }
}

// Initialize the app
new ElectronApp();
