const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
var mysql = require('mysql');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let configFile = require('./config.json');
let menuFile = require(configFile.global.menuFile);

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
        show: false
    });

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

    // Create event handlers for new page requests
    ipcMain.on('load-settings', (event) => {
        // NOT DONE YET
        win.loadFile('components/kiosk/settings.html');
    });
    ipcMain.on('load-menu', (event) => {
        win.loadFile('components/kiosk/index.html');
    });

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
    event.returnValue = menuFile;
});
ipcMain.on('request-debug', (event) => {
    event.returnValue = debug;
});
ipcMain.on('submitOrder', (event, cart) => {
    var con = mysql.createConnection({
    });

    con.connect(function(err) {
        if (err) throw err;

        var sql = "INSERT INTO order_stats (restaurant_id, order_date, dine_in, order_code, total_cost) VALUES ('1', curdate(), '1', '13', '11.99')";
        
        con.query(sql, function(err, result) {
            if (err) throw err;
            console.log("1 record inserted")
            event.returnValue = '1 record inserted'
        })
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
