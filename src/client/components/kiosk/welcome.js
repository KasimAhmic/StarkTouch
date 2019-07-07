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

    //document.querySelectorAll('.list-item-name').forEach((name) => {
    //    var height = name.offsetHeight;
    //    name.style.paddingTop = (height / 2) + 'px';
    //    name.style.paddingBottom = (height / 2) + 'px';
    //});
}

init();
