const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
var request = require('request');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let configFile = require('./config.json');

// Temporary JSON order files. To be replaced with database queries
let orderProgressFile = require(configFile.global.orderProgressFile);
let orderReadyFile = require(configFile.global.orderReadyFile);

// Chrome debug boolean
var debug = true;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1800,
        height: 950,
        title: 'StarkTouch POS',
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true,
        show: false,
        icon: 'icon.ico'
    });

    //win.loadFile('components/' + configFile.global.componentToLaunch + '/index.html');

    // Load index.html file of configured component
    if (configFile.global.componentToLaunch == 'kiosk') {
        win.loadFile('components/' + configFile.global.componentToLaunch + '/welcome.html');
    }
    else {
        win.loadFile('components/' + configFile.global.componentToLaunch + '/index.html');
    }

    // Show window once all assets are loaded
    win.once('ready-to-show', () => {
        win.show();
    })

    // Open the DevTools
    if (debug) {
        win.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}

// Create event handlers for component requests
ipcMain.on('request-config', (event) => {
    event.returnValue = configFile;
});
ipcMain.on('request-menu', (event) => {
    var options = {
        method: 'POST',
        url: 'http://localhost:3000/getMenu'
    };
    request(options, function (error, response, body) {
        if (error) {
            throw new Error(error);
        }
        event.returnValue = JSON.parse(body);
    });
});
// Create event handlers for new page requests
ipcMain.on('load-settings', (event) => {
    // NOT DONE YET
    win.loadFile('components/kiosk/settings.html');
    event.returnValue = null;
});
ipcMain.on('load-menu', (event) => {
    win.loadFile('components/kiosk/index.html');
    event.returnValue = null;
});

ipcMain.on('request-debug', (event) => {
    event.returnValue = debug;
});
ipcMain.on('submitOrder', (event, cart, total) => {
    var options = {
        method: 'POST',
        url: 'http://localhost:3000/submitOrder',
        form: {
            cart: JSON.stringify(cart),
            name: 'Kasim',
            total: total,
            dineIn: true
        }
    };

    request(options, function (err, response, body) {
        if (err) throw err;
        event.reply('submitOrderResponse', body);
    });
});

// TO BE REMOVED - Legacy event handler
ipcMain.on('config-order', (event) => {
    event.returnValue = [configFile, orderProgressFile, orderReadyFile];
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
