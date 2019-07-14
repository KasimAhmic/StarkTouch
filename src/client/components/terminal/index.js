const { ipcRenderer } = require('electron');
const menu = JSON.parse(ipcRenderer.sendSync('getMenu'));
const config = ipcRenderer.sendSync('request-config');
var terminalMenuIndex = ipcRenderer.sendSync('getIndex', config.terminal.type);

function init() {
    generateColumns(config.terminal.maxColumns);
    setInterval(function() {
        ipcRenderer.send('checkForUpdates');
    }, 5000);
}

function generateColumns(maxCols) {
    var columnTemplate = `
    <div class="order-column" data-availability="available" style="width: ${100 / config.terminal.maxColumns + '%'}">
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

    ipcRenderer.send('getIncompleteOrder', 'main');
}
var orders;
ipcRenderer.on('getIncompleteOrderResponse', (event, res) => {
    orders = JSON.parse(res);

    document.querySelectorAll('.order-column').forEach((element, index) => {
        if (orders[index] != undefined) {
            // Populate the order number on the top row
            element.querySelector('.order-number span').textContent = orders[index].orderNumber;
            element.dataset.orderNumber = orders[index].orderNumber;
            element.dataset.availability = 'unavailable';

            for (i = 0; i < orders[index].items.length; i++) {
                var entreeIndex = i;
                // Create list element and input the name of the item
                var itemIndex;
                var item = document.createElement('li');
                if (config.terminal.type == 'entree') {
                    itemIndex = orders[index].items.length > 1 ? orders[index].items[i].entree_ordered : orders[index].items[0].entree_ordered;
                        item.dataset.status = 'not-in-progress';
                        item.dataset.itemIndex = itemIndex;
                        item.className = 'item';
                        item.id = 'item-' + i + '-' + orders[index].orderId + '-' + itemIndex + '-' + orders[index].items[i].ordered_entree_id;
                        item.innerHTML = menu[terminalMenuIndex].items[itemIndex].description;
                        item.addEventListener('click', function() {
                            updateOrder(this.id);
                        });
                } else {
                    itemIndex = orders[index].items.length > 1 ? orders[index].items[i] : orders[index].items[0];
                        item.dataset.status = 'not-in-progress';
                        item.dataset.itemIndex = itemIndex;
                        item.className = 'item';
                        item.id = 'item-' + i + '-' + orders[index].orderId + '-' + itemIndex;
                        item.innerHTML = menu[terminalMenuIndex].items[itemIndex[config.terminal.type + '_ordered'] - 1].description;
                        item.addEventListener('click', function() {
                            updateOrder(this.id);
                        });
                }

                element.querySelector('.list').appendChild(item); // Append the item to the list
                
                if (config.terminal.type == 'entree') {
                    var toppingsArray = orders[index].toppings;
                    var toppingsContainer = document.createElement('ul');
                        toppingsContainer.className = 'toppings';
                    for (x = 0; x < toppingsArray.length; x++) {
                        var topping = document.createElement('li');
                            topping.id = 'topping-' + toppingsArray[x].topping + '-' + orders[index].items[i].ordered_entree_id;
                            topping.innerHTML = '- ' + menu['toppings'][0].filter(top => top.toppings_id == toppingsArray[x].topping)[0].topping_desc;
                        if (toppingsArray[x].ordered_entree_id == orders[index].items[i].ordered_entree_id) {
                            toppingsContainer.appendChild(topping);
                        }
                        if (document.getElementById('item-' + i + '-' + orders[index].orderId + '-' + itemIndex + '-' + orders[index].items[i].ordered_entree_id) != null) {
                            document.getElementById('item-' + i + '-' + orders[index].orderId + '-' + itemIndex + '-' + orders[index].items[i].ordered_entree_id).appendChild(toppingsContainer);
                        }
                    }
                }
            }

            // Create the done button
            var doneButton = document.createElement('button');
                doneButton.className = 'done-button';
                doneButton.innerHTML = 'Complete';
                doneButton.disabled = true;
                doneButton.dataset.orderNumber = orders[index].orderId;
                doneButton.addEventListener('click', function() {
                    ipcRenderer.send('completeOrder', orders[index].orderId);
                });

            element.appendChild(doneButton); // Apend the done button to the column
        }
    });
});

function updateOrder(item) {
    var element = document.getElementById(item);
    var counter = 0;

    if (element.dataset.status == 'not-in-progress') {
        element.dataset.status = 'in-progress';
        element.querySelectorAll('li').forEach((item) => {
            item.dataset.status = 'in-progress';
        });
    } else if (element.dataset.status == 'in-progress') {
        element.dataset.status = 'done';
        element.querySelectorAll('li').forEach((item) => {
            item.dataset.status = 'done';
        });
    }

    var elementList = element.parentElement.querySelectorAll('li.item');

    for (i = 0; i < elementList.length; i++) {
        if (elementList[i].dataset.status == 'done') {
            counter++;
        }
    }
    if (counter == elementList.length) {
        document.querySelector('button[data-order-number="' + element.id.split('-')[2] + '"]').disabled = false;
    }
}

ipcRenderer.on('completeOrderResponse', (event, res) => {
    var completedOrder = document.querySelector('div[data-order-number="' + res + '"]');
        completedOrder.dataset.availability = 'available';
        completedOrder.dataset.orderNumber = '';
        completedOrder.querySelector('span').textContent = '';
        completedOrder.querySelector('.list').innerHTML = '';
        completedOrder.querySelector('button').remove();
});

var incompleteOrders;
ipcRenderer.on('checkForUpdatesResponse', (event, res) => {
    var openColumns = document.querySelectorAll('[data-availability="available"]');
    if (openColumns.length > 0) {
        var currentOrders = [];
        document.querySelectorAll('.order-number span').forEach((span) => {
            if (span.textContent != '') {
                currentOrders.push(parseInt(span.textContent));
            }
        });
        var additionalOrdersSet = new Set();
        incompleteOrders = JSON.parse(res);

        for (o = 0; o < openColumns.length; o++) {
            for (i = 0; i < incompleteOrders.length; i++) {
                if (!currentOrders.includes(incompleteOrders[i].orderNumber)) {
                    additionalOrdersSet.add(incompleteOrders[i]);
                }
            }
            additionalOrdersArr = Array.from(additionalOrdersSet);
            if (additionalOrdersArr.length > 0 && additionalOrdersArr[o] != undefined) {
                openColumns[o].dataset.availability = 'unavailable';
                openColumns[o].dataset.orderNumber = additionalOrdersArr[o].orderNumber;
                openColumns[o].querySelector('.order-number span').textContent = additionalOrdersArr[o].orderNumber;

                additionalOrdersArr[o].items.forEach((item, index) => {
                    var listItem = document.createElement('li');
                    var itemIndex;
                    if (config.terminal.type == 'entree') {
                        itemIndex = additionalOrdersArr[o].items.length > 1 ? additionalOrdersArr[o].items[index].entree_ordered : additionalOrdersArr[o].items[0].entree_ordered;
                        listItem.dataset.status = 'not-in-progress';
                        listItem.dataset.itemIndex = itemIndex;
                        listItem.className = 'item';
                        listItem.id = 'item-' + i + '-' + additionalOrdersArr[o].orderId + '-' + itemIndex + '-' + additionalOrdersArr[o].items[index].ordered_entree_id;
                        listItem.innerHTML = menu[terminalMenuIndex].items[itemIndex].description;
                        listItem.addEventListener('click', function() {
                            updateOrder(this.id);
                        });
                    } else {
                        itemIndex = additionalOrdersArr[o].items.length > 1 ? additionalOrdersArr[o].items[index] : additionalOrdersArr[o].items[0];
                        listItem.dataset.status = 'not-in-progress';
                        listItem.dataset.itemIndex = itemIndex;
                        listItem.className = 'item';
                        listItem.id = 'item-' + index + '-' + additionalOrdersArr[o].orderId + '-' + itemIndex;
                        listItem.innerHTML = menu[terminalMenuIndex].items[itemIndex[config.terminal.type + '_ordered'] - 1].description;
                        listItem.addEventListener('click', function() {
                            updateOrder(this.id);
                        });
                    }
                    
                    openColumns[o].querySelector('.list').appendChild(listItem);

                    if (config.terminal.type == 'entree') {
                        var toppingsArray = additionalOrdersArr[o].toppings;
                        var toppingsContainer = document.createElement('ul');
                            toppingsContainer.className = 'toppings';
                        for (x = 0; x < toppingsArray.length; x++) {
                            var topping = document.createElement('li');
                                topping.id = 'topping-' + toppingsArray[x].topping + '-' + additionalOrdersArr[o].items[index].ordered_entree_id;
                                topping.innerHTML = '- ' + menu['toppings'][0].filter(top => top.toppings_id == toppingsArray[x].topping)[0].topping_desc;
                            if (toppingsArray[x].ordered_entree_id == additionalOrdersArr[o].items[index].ordered_entree_id) {
                                toppingsContainer.appendChild(topping);
                            }
                            if (document.getElementById('item-' + i + '-' + additionalOrdersArr[o].orderId + '-' + itemIndex + '-' + additionalOrdersArr[o].items[index].ordered_entree_id) != null) {
                                document.getElementById('item-' + i + '-' + additionalOrdersArr[o].orderId + '-' + itemIndex + '-' + additionalOrdersArr[o].items[index].ordered_entree_id).appendChild(toppingsContainer);
                            }
                        }
                    }
                });

                var doneButton = document.createElement('button');
                    doneButton.className = 'done-button';
                    doneButton.innerHTML = 'Complete';
                    doneButton.disabled = true;
                    doneButton.dataset.orderNumber = additionalOrdersArr[o].orderId;
                    doneButton.addEventListener('click', function() {
                        ipcRenderer.send('completeOrder', this.dataset.orderNumber, true);
                    });

                openColumns[o].appendChild(doneButton);
            }
        }
        openColumns = [];
    }
});

init();