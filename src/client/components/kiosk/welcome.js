// Electron
const { ipcRenderer } = require('electron');

function init() {
    createEventListeners();
}

function createEventListeners() {
    var button = document.getElementById('button');

    button.addEventListener('click', function() {
        ipcRenderer.sendSync('load-menu');
    });
}

init();
