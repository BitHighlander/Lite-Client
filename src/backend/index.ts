import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { IpcChannel, IpcMainChannel, OllamaChannel } from '../events';
import {
  initOllama,
  getAllModels,
  askOlama,
  getModel,
  setModelFolderPath,
  getModelsFolderPath,
  stopOllamaServe,
} from './handlers';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async (): Promise<void> => {
  mainWindow = new BrowserWindow({
    icon: 'icon.png',
    height: 800,
    width: 1200,
    autoHideMenuBar: true,
    frame: false,
    resizable: isDev,
    fullscreenable: false,
    show: true,
    movable: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
  });

  // and load the index.html of the app.
  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', async () => {
  await createWindow();

  ipcMain.on(IpcMainChannel.CommandOuput, (_, output: string) => {
    console.log(output);
  });

  ipcMain.handle(OllamaChannel.OllamaInit, initOllama);
  ipcMain.handle(OllamaChannel.OllamaGetAllModels, getAllModels);
  ipcMain.handle(OllamaChannel.OllamaQuestion, askOlama);
  ipcMain.handle(OllamaChannel.OllamaGetModel, getModel);

  ipcMain.on(IpcChannel.Close, () => app.quit());
  ipcMain.on(IpcChannel.Minimize, () => mainWindow.minimize());
  ipcMain.handle(IpcChannel.GetModelsPath, getModelsFolderPath);
  ipcMain.handle(IpcChannel.SetFolderPath, setModelFolderPath);
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  // shutdown ollama
  await stopOllamaServe();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

export const sendOllamaStatusToRenderer = async (status: string) => {
  mainWindow.webContents.send(OllamaChannel.OllamaStatusUpdate, status);
};

export const isDev = !app.isPackaged;
export const appPath = path.parse(app.getPath('exe')).dir;
