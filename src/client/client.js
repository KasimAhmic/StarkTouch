const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const { readFileSync } = require('fs')
var request = require('request');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let configFile = require('./config.json');
let compiledconfig = readFileSync('./test.json')

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
    if (configFile.componentToLaunch == 'kiosk') {
        win.loadFile('components/kiosk/welcome.html');
    } else {
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

// Create event handlers for component requests
ipcMain.on('request-config', (event) => {
    event.returnValue = configFile;
});
ipcMain.on('getMenu', (event) => {
    var options = {
        method: 'GET',
        url: configFile.server.serverURL + '/getMenu'
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
ipcMain.on('load-kiosk', (event) => {
    win.loadFile('components/kiosk/welcome.html');
    event.returnValue = null;
});
ipcMain.on('load-menu', (event) => {
    win.loadFile('components/kiosk/index.html');
    event.returnValue = null;
});
ipcMain.on('load-register', (event) => {
    // NOT DONE YET
    win.loadFile('components/register/index.html');
    event.returnValue = null;
});
ipcMain.on('load-burger', (event) => {
    // NOT DONE YET
    win.loadFile('components/burger/index.html');
    event.returnValue = null;
});
ipcMain.on('load-fryer', (event) => {
    // NOT DONE YET
    win.loadFile('components/fryer/index.html');
    event.returnValue = null;
});
ipcMain.on('load-drinks', (event) => {
    // NOT DONE YET
    win.loadFile('components/drinks/index.html');
    event.returnValue = null;
});
ipcMain.on('load-emp-consolidate', (event) => {
    // NOT DONE YET
    win.loadFile('components/employee-consolidation/index.html');
    event.returnValue = null;
});
ipcMain.on('load-cust-consolidate', (event) => {
    win.loadFile('components/consolidation/index.html');
    event.returnValue = null;
});
ipcMain.on('load-manager', (event) => {
    // NOT DONE YET
    win.loadFile('components/manager/index.html');
    event.returnValue = null;
});

// Submits order to the database
ipcMain.on('submitOrder', (event, name, cart, subtotal, tax, total) => {
    var options = {
        method: 'POST',
        url: configFile.server.serverURL + '/submitOrder',
        form: {
            cart: JSON.stringify(cart),
            name: name,
            subtotal: subtotal,
            tax: tax,
            total: total,
            dineIn: true
        }
    };

    request(options, function (err, response, body) {
        if (err) throw err;
        event.reply('submitOrderResponse', body);
    });
});

// Searches database for incompelete orders and returns them
ipcMain.on('getIncompleteOrder', (event, type) => {
    var options = {
        method: 'GET',
        url: configFile.server.serverURL + '/getIncompleteOrder',
        form: {
            type: configFile.terminal.type
        }
    };

    request(options, function (err, response, body) {
        if (err) throw err;
        if (type == 'main') {
            event.reply('getIncompleteOrderResponse', body);
        } else {
            event.reply('getAdditionalOrderResponse', body);
        }
    });
});

// Converts food type names into integers
ipcMain.on('getIndex', (event, type) => {
    if (type == 'entree') {
        event.returnValue = 0;
    } else if (type == 'side') {
        event.returnValue = 1;
    } else if (type == 'dessert') {
        event.returnValue = 2;
    } else {
        event.returnValue = 3;
    }
});

ipcMain.on('completeOrder', (event, orderId) => {
    var options = {
        method: 'POST',
        url: configFile.server.serverURL + '/completeOrder',
        form: {
            orderId: orderId,
            type: configFile.terminal.type
        }
    };
    request(options, function (err, response, body) {
        if (err) throw err;
        event.reply('completeOrderResponse', body);
    });
});

ipcMain.on('checkForUpdates', (event) => {
    var options = {
        method: 'GET',
        url: configFile.server.serverURL + '/getIncompleteOrder',
        form: {
            type: configFile.terminal.type
        }
    };

    request(options, function (err, response, body) {
        if (err) throw err;
        event.reply('checkForUpdatesResponse', body);
    });
});

// TO BE REMOVED - Legacy event handler
ipcMain.on('config-order', (event) => {
    event.returnValue = [configFile, orderProgressFile, orderReadyFile];
});

ipcMain.on('request-debug', (event) => {
    event.returnValue = debug;
});