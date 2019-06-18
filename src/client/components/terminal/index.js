const { ipcRenderer } = require('electron');
var config = ipcRenderer.sendSync('request-config');

function init() {
    generateColumns(config.terminal.maxColumns);
}

function generateColumns(maxCols) {
    columnTemplate = `
    <div class="order-column">
        <div class="order-number">
            <span>888</span>
        </div>
        <div class="order-contents">

        </div>
    </div>`;

    for (i = 0; i < maxCols; i++) {
        document.getElementById('column-container').innerHTML += columnTemplate;
    }
}

init();