// Electron
const { ipcRenderer } = require('electron');

ipcRenderer.send('trackOrders');

ipcRenderer.on('trackOrdersResponse', function(event, res) {
    console.log('response')
});

init();
