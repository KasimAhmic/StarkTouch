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
    var list = document.getElementById('menu-screen').getElementsByClassName('menu-icon');
    for (i = 0; i < list.length; i++) {
        var menuListing = list[i].id;
        list[i].addEventListener('click', function() {
            ipcRenderer.sendSync(menuListing);
        });
    }
}

init();
