import { contextBridge, ipcRenderer } from "electron";
import type { OpenDialogOptions, SaveDialogOptions } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // App information
  getAppVersion: () => ipcRenderer.invoke("app/getVersion"),
  getAppName: () => ipcRenderer.invoke("app/getName"),

  // File dialogs
  showOpenDialog: (options: OpenDialogOptions) =>
    ipcRenderer.invoke("dialog/showOpenDialog", options),
  showSaveDialog: (options: SaveDialogOptions) =>
    ipcRenderer.invoke("dialog/showSaveDialog", options),

  // External links
  openExternal: (url: string) => ipcRenderer.invoke("shell/openExternal", url),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("window/minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window/maximize"),
  closeWindow: () => ipcRenderer.invoke("window/close"),

  // Platform detection
  platform: process.platform,

  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
});

// Define the type for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getAppName: () => Promise<string>;
      showOpenDialog: (
        options: OpenDialogOptions,
      ) => Promise<Electron.OpenDialogReturnValue>;
      showSaveDialog: (
        options: SaveDialogOptions,
      ) => Promise<Electron.SaveDialogReturnValue>;
      openExternal: (url: string) => Promise<void>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      platform: string;
      isDevelopment: boolean;
    };
  }
}
