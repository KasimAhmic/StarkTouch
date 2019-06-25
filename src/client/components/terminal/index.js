const { ipcRenderer } = require('electron');
const menu = JSON.parse(ipcRenderer.sendSync('getMenu'));
const config = ipcRenderer.sendSync('request-config');
var terminalMenuIndex = ipcRenderer.sendSync('getIndex', config.terminal.type);
var itemIndex;

function init() {
    generateColumns(config.terminal.maxColumns);
}

function generateColumns(maxCols) {
    columnTemplate = `
    <div class="order-column">
        <div class="order-number">
            <span></span>
        </div>
        <div class="order-contents">
            <ul class="list"></ul>
        </div>
    </div>`;

    for (i = 0; i < maxCols; i++) {
        document.getElementById('column-container').innerHTML += columnTemplate;
    }
    document.querySelectorAll('.order-column').forEach((column) => {
        column.style.width = 100 / config.terminal.maxColumns + '%';
    })

    ipcRenderer.send('getIncompleteOrder');
}

ipcRenderer.on('getIncompleteOrderResponse', (event, res) => {
    console.log(res)
    var orders = JSON.parse(res);

    document.querySelectorAll('.order-column').forEach((element, index) => {
        if (orders[index] != undefined) {
            // Populate the order number on the top row
            element.querySelector('.order-number span').textContent = orders[index].orderNumber;

            // Populate the order contents section with the multiple items returned
            if (orders[index].items.length > 1) {
                for (i = 0; i < orders[index].items.length; i++) {
                    // Create list element and input the name of the item
                    var itemIndex = orders[index].items[i];
                    var item = document.createElement('li');
                        item.dataset.status = 'not-in-progress';
                        item.dataset.itemIndex = itemIndex;
                        item.className = 'item';
                        item.id = 'item-' + orders[index].orderId + '-' + itemIndex;
                        item.innerHTML = menu[terminalMenuIndex].items[itemIndex].name;
                        item.addEventListener('click', function() {
                            updateOrder(this.id);
                        });

                    // Append the item to the list
                    element.querySelector('.list').appendChild(item);
                }
            // Populate the order contents section with the one item returned
            } else {
                // Create list element and input the name of the item
                var itemIndex = orders[index].items[0];
                var item = document.createElement('li');
                    item.dataset.status = 'not-in-progress';
                    item.className = 'item';
                    item.id = 'item-' + orders[index].orderId + '-' + itemIndex;
                    item.innerHTML = menu[terminalMenuIndex].items[itemIndex].name;
                    item.addEventListener('click', function() {
                        updateOrder(this.id);
                    });
                    
                // Append the item to the list
                element.querySelector('.list').appendChild(item);
            }

            var doneButton = document.createElement('button');
                doneButton.className = 'done-button';
                doneButton.innerHTML = 'Complete';
                doneButton.disabled = true;
                doneButton.dataset.orderNumber = orders[index].orderId;
                doneButton.addEventListener('click', function() {
                    completeOrder(orders[index].orderId);
                });
            element.appendChild(doneButton);
        }
    });
});

function updateOrder(item) {
    var element = document.getElementById(item);
    var counter = 0;

    if (element.dataset.status == 'not-in-progress') {
        element.dataset.status = 'in-progress';
    } else if (element.dataset.status == 'in-progress') {
        element.dataset.status = 'done';
    }

    var elementList = element.parentElement.querySelectorAll('li');

    for (i = 0; i < elementList.length; i++) {
        if (elementList[i].dataset.status == 'done') {
            counter++;
        }
    }
    if (counter == elementList.length) {
        document.querySelector('[data-order-number="' + element.id.slice(5,-2) + '"]').disabled = false;
    }
}
function completeOrder(item) {
    console.log(item)
}

init();