const { ipcRenderer } = require('electron');

function init() {
    ipcRenderer.send('trackOrders');

    setInterval(function() {
        ipcRenderer.send('trackOrders');
    }, 5000);
}

ipcRenderer.on('trackOrdersResponse', function(event, res) {
    var incompleteOrders = JSON.parse(res);
    var inProgress = document.getElementById('in-progress');
    var ready = document.getElementById('ready');
    inProgress.innerHTML = '';
    ready.innerHTML = '';

    for (i = 0; i < incompleteOrders.length; i++) {
        var o = incompleteOrders[i];
        var span = document.createElement('span');
            span.textContent = o.orderNumber;
            span.dataset.orderNumber = o.orderNumber;

        if (Object.values(o).some(type => (type == null))) {
            inProgress.appendChild(span);
        } else if (Object.values(o).every(type => (type != null))) {
            span.addEventListener('click', function() {
                ipcRenderer.send('pickUpOrder', this.dataset.orderNumber);
                this.remove();
            });
            ready.appendChild(span);
        }
    }
});

init();
