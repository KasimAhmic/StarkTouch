// Electron
const { ipcRenderer } = require('electron');
var request = require("request");

function init() {
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
