// Electron
const { ipcRenderer } = require('electron');

// Global Variables
var menu;
var config;
var shoppingCart = [];

// Debug
var dubug;

// Main Functions
function init() {
    // Debug related initilization
    debug = ipcRenderer.sendSync('request-debug');
    if (debug) {runDebug()}

    config = ipcRenderer.sendSync('request-config');
    menu = ipcRenderer.sendSync('request-menu');

    createCategoryButtons();
    createItemButtons(config.kiosk.currentTab);

    document.getElementById('submit').addEventListener('click', function() {
        submitOrder(shoppingCart);
    });
}

// Creates the category buttons at the top of the page
function createCategoryButtons() {
    // Reads the categories from the config file
    var categories = Object.keys(menu);

    for (i = 0; i < categories.length; i++) {
        var button = document.createElement('button');
            button.textContent = menu[String(i)].name;
            button.dataset.category = Object.keys(menu)[i];
            button.addEventListener("click", function() {
                config.kiosk.currentTab = this.dataset.category;
                document.querySelector('.itemButton').addEventListener('animationend', function() {
                    createItemButtons();
                });
                document.querySelectorAll('.itemButton').forEach((itemButton) => {
                    itemButton.className = 'itemButton animated fadeOutRight faster';
                });
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
            itemButton.className = 'itemButton animated fadeInLeft faster';
            itemButton.dataset.item = item.name;
            itemButton.dataset.target = i;
            itemButton.style.backgroundImage = 'url(' + item.image + ')';
            itemButton.addEventListener("click", function() {
                addToCart(this.dataset.target);
                this.className = 'itemButton animated bounce fast';
            });
            itemButton.addEventListener('animationend', function() {
                this.classList.remove('bounce');
            });
        var itemPrice = document.createElement('span');
            itemPrice.className = 'list-item-price';
            itemPrice.textContent = item.price;
        var itemName = document.createElement('span');
            itemName.className = 'list-item-name';
            itemName.textContent = item.name;
        itemButton.appendChild(itemPrice);
        itemButton.appendChild(itemName);
        itemDiv.appendChild(itemButton);
    }

    itemDiv.querySelectorAll('.list-item-name').forEach((name) => {
        var height = name.offsetHeight;
        name.style.paddingTop = (height / 2) + 'px';
        name.style.paddingBottom = (height / 2) + 'px';
    });
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
    var itemName;

    cartContainer.innerHTML = '';

    for (var i = 0; i < shoppingCart.length; i ++) {
        /*
         * Legacy item instertion code for temporary reference only.
         */

        //var itemTemplate = `
        //<li data-name="${removeSpaces((shoppingCart[i].name + '-' + i))}">
        //    <button data-name="${removeSpaces((shoppingCart[i].name + '-' + i))}" onclick="removeFromCart('${removeSpaces(removeSpaces(shoppingCart[i].name + '-' + i))}', ${i})" class="remove-item-button"></button>
        //    <span class="cart-item-name">${shoppingCart[i].name}</span>
        //    <span class="cart-item-price">${shoppingCart[i].price}</span>
        //</li>`
        //cartContainer.innerHTML += itemTemplate;

        // Entry Wrapper
        entryContainer = document.createElement('li');
        entryContainer.dataset.name = removeSpaces((shoppingCart[i].name + '-' + i));
        // Remove Button
        removeButton = document.createElement('button');
        removeButton.dataset.name = removeSpaces((shoppingCart[i].name + '-' + i));
        removeButton.className = 'remove-item-button';
        removeButton.addEventListener('click', function() {
            removeFromCart(this.dataset.name, i);
        });
        // Edit Button
        editButton = document.createElement('button');
        editButton.dataset.name = removeSpaces((shoppingCart[i].name + '-' + i));
        editButton.textContent = 'E';
        // Item Name
        itemName = document.createElement('span');
        itemName.className = 'cart-item-name';
        itemName.textContent = shoppingCart[i].name;
        // Item Price
        itemPrice = document.createElement('span');
        itemPrice.className = 'cart-item-price';
        itemPrice.textContent = shoppingCart[i].price;
        // Append elements to entry container
        entryContainer.appendChild(removeButton);
        //entryContainer.appendChild(editButton); // TODO: Implement edit button
        entryContainer.appendChild(itemName);
        entryContainer.appendChild(itemPrice);
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
    shoppingCart.total = total;

    document.getElementById('subtotal').innerText = '$' + subtotal;
    document.getElementById('tax').innerText = '$' + tax;
    document.getElementById('total').innerText = '$' + total;
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
    [subtotal, tax, total] = calculateTotals();
    ipcRenderer.send('submitOrder', cart, total);
}

ipcRenderer.on('submitOrderResponse', (event, res) => {
    console.log(res)
});

// Leave this function for educational purposes
//function getOrderNumber() {
//    return new Promise((resolve, reject) => {
//        request('http://127.0.0.1:3000/getOrderNumber', (error, response, body) => {
//            if (error) reject(error);
//            if (response.statusCode != 200) {
//                reject('Invalid status code <' + response.statusCode + '>');
//            }
//            resolve(body);
//        });
//    });
//}

// Helper Functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function removeSpaces(str) {
    return str.replace(/\s+/g, '-');
}
function runDebug() {
    var debugButton = document.createElement('button');
        debugButton.className = 'debug';
        debugButton.textContent = 'Reload';
        debugButton.addEventListener('click', function() {
            location.reload();
        });
    document.body.appendChild(debugButton);

    document.addEventListener('keydown', function(event) {
        if (event.code == 'F5') {
            location.reload();
        }
    });
}

init();