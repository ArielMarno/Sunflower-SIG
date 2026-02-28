const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const USERS_PATH = path.join(app.getPath('userData'), 'users.json');

function getStoredUsers() {
  if (!fs.existsSync(USERS_PATH)) {
    const defaultUsers = [{ user: 'admin', pass: '1234', role: 'ADMIN' }];
    fs.writeFileSync(USERS_PATH, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  } catch (e) {
    return [{ user: 'admin', pass: '1234', role: 'ADMIN' }];
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    title: "Sunflower - Sistema de Gestión",
    icon: path.join(__dirname, 'favicon.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  win.maximize();

  win.once('ready-to-show', () => {
    win.show();
  });

  //MANEJO DE RUTAS
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }
  
  win.setMenu(null);
}

// COMUNICACION IPC
const { machineIdSync } = require('node-machine-id');
ipcMain.handle('get-machine-id', async () => {
  return machineIdSync({ original: true });
});

ipcMain.handle('login-attempt', async (event, { username, password }) => {
  const users = getStoredUsers();
  
  const found = users.find(u => 
    u.user.trim().toLowerCase() === username.trim().toLowerCase() && 
    String(u.pass) === String(password)
  );
  return found ? { success: true, role: found.role } : { success: false };
});

ipcMain.handle('get-all-users', () => getStoredUsers());

ipcMain.handle('save-users', (event, updatedUsers) => {
  try {
    fs.writeFileSync(USERS_PATH, JSON.stringify(updatedUsers, null, 2));
    return true;
  } catch (e) {
    console.error("Error al guardar usuarios:", e);
    return false;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});