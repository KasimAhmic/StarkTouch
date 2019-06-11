// Electron
const { ipcRenderer } = require('electron');
var request = require("request");

// Debug
var dubug;

function init() {
    debug = ipcRenderer.sendSync('request-debug');
    if (debug) {
        var debugButton = document.createElement('button');
            debugButton.className = 'debug';
            debugButton.textContent = 'Reload';
            debugButton.addEventListener('click', function() {
                location.reload();
            });
        document.body.appendChild(debugButton);
    }
    createEventListeners();
}

function createEventListeners() {
    var button1 = document.getElementById('button-1');
    var button2 = document.getElementById('button-2');

    button1.addEventListener('click', function() {
        ipcRenderer.sendSync('load-settings');
    });
    button2.addEventListener('click', function() {
        ipcRenderer.sendSync('load-menu');
    });
}

init();
