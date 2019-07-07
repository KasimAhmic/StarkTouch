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
    var button = document.getElementById('button');

    button.addEventListener('click', function() {
        ipcRenderer.sendSync('load-menu');
    });

    //document.querySelectorAll('.list-item-name').forEach((name) => {
    //    var height = name.offsetHeight;
    //    name.style.paddingTop = (height / 2) + 'px';
    //    name.style.paddingBottom = (height / 2) + 'px';
    //});
}

init();
