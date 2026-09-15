'use strict';

const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 760,
        minWidth: 860,
        minHeight: 560,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    win.setMenuBarVisibility(false);
    win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
