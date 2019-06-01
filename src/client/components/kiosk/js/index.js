// Electron
const { ipcRenderer } = require('electron');
var request = require("request");

// Global Variables
var menu;
var config;
var shoppingCart = [];
var server = 'http://127.0.0.1:3000/submitOrder';

// Main Functions
function init() {
    [config, menu] = ipcRenderer.sendSync('config-menu');
    createCategoryButtons();
}

function createCategoryButtons() {
    var categories = Object.keys(menu);

    for (i = 0; i < categories.length; i++) {
        var button = document.createElement('button');
            button.textContent = menu[String(i)].name;
            button.dataset.category = Object.keys(menu)[i];
            button.addEventListener("click", function() {
                config.kiosk.currentTab = this.dataset.category;
                createItemButtons();
            });
        document.getElementById('categories').appendChild(button);
    }
}

function createItemButtons() {
    var currentTab = Object.values(config.kiosk.currentTab);
    var itemDiv = document.getElementById('items');
    itemDiv.innerHTML = '';

    for (i = 0; i < menu[currentTab].items.length; i++) {
        var item = menu[currentTab].items[i];
        var itemButton = document.createElement('div');
            itemButton.dataset.item = item.name;
            itemButton.className = 'itemButton';
            itemButton.textContent = item.price + ' - ' + item.name;
            itemButton.dataset.target = i;
            itemButton.addEventListener("click", function() {
                addToCart(this.dataset.target);
            });
        itemDiv.appendChild(itemButton);
    }
}

function addToCart(itemIndex) {
    var item = menu[config.kiosk.currentTab].items[itemIndex];
    item['type'] = menu[config.kiosk.currentTab].name;

    shoppingCart.push(item);
    updateCart();
}

function updateCart() {
    var cartContainer = document.getElementById('cart');
    var entryContainer;
    var removeButton;
    var editButton;
    var itemEntry;

    cartContainer.innerHTML = '';

    for (var i = 0; i < shoppingCart.length; i ++) {
        // Entry Wrapper
        entryContainer = document.createElement('li');
        entryContainer.dataset.name = removeSpaces((shoppingCart[i].name + '-' + i));
        // Remove Button
        removeButton = document.createElement('button');
        removeButton.dataset.name = removeSpaces((shoppingCart[i].name + '-' + i));
        removeButton.textContent = 'X';
        removeButton.addEventListener('click', function() {
            removeFromCart(this.dataset.name, i);
        });
        // Edit Button
        editButton = document.createElement('button');
        editButton.dataset.name = removeSpaces((shoppingCart[i].name + '-' + i));
        editButton.textContent = 'E';
        // Item Name
        itemEntry = document.createElement('span');
        itemEntry.dataset.name = removeSpaces((shoppingCart[i].name + '-' + i));
        itemEntry.textContent = shoppingCart[i].price + ' - ' + shoppingCart[i].name;
        // Append elements to entry container
        entryContainer.appendChild(removeButton);
        entryContainer.appendChild(editButton);
        entryContainer.appendChild(itemEntry);
        // Append entry container to shopping cart
        cartContainer.appendChild(entryContainer);
    }

    updateTotals();
}

function removeFromCart(name, index) {
    document.getElementById('cart').querySelector('[data-name=' + name + ']').remove();
    shoppingCart.pop(index);
    updateTotals();
}

function updateTotals() {
    [subtotal, tax, total] = calculateTotals();
    console.log('Subtotal: $' + subtotal + ' | Tax: $' + tax + ' | Total: $' + total);
}

function calculateTotals() {
    var subtotal = 0.0;
    var tax = 0.0;
    var total = 0.0;

    for (var i = 0; i < shoppingCart.length; i++) {
        subtotal += parseFloat((shoppingCart[i].price).replace('$', ''));
        tax = subtotal * 0.07;
        total = subtotal + tax;
    }

    return [subtotal.toFixed(2), tax.toFixed(2), total.toFixed(2)];
}

function submitOrder(cart) {
    var options = {
        method: 'POST',
        url: 'http://127.0.0.1:3000/submitOrder',
        headers: {
            'cache-control': 'no-cache',
            Connection: 'keep-alive',
            'accept-encoding': 'gzip, deflate',
            Host: '127.0.0.1:3000',
            'Cache-Control': 'no-cache',
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            cart: JSON.stringify(cart),
            name: 'Kasim'
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
    });
}

function getOrderNumber(callback) {
    var options = {
        method: 'GET',
        url: 'http://127.0.0.1:3000/getOrderNumber',
        headers: {
            'cache-control': 'no-cache',
            Connection: 'keep-alive',
            'accept-encoding': 'gzip, deflate',
            Host: '127.0.0.1:3000',
            'Cache-Control': 'no-cache',
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    request(options, function(error, response, body) {
        if (error) throw new Error(error);
        return callback(body);
    });
}

// Helper Functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function removeSpaces(str) {
    return str.replace(/\s+/g, '-');
}

init();