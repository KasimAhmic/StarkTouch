// Electron
const { ipcRenderer } = require('electron');

function init() {
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
