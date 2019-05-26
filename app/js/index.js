// Global Variables
var menu;
var config = {
    currentTab: 'Sandwiches',
    menuFile: './js/menuv2.json'
}
var shoppingCart = [];

// Main Functions
function init() {
    menu = require(config.menuFile);
    createCategoryButtons();
}

function createCategoryButtons() {
    var categories = Object.keys(menu);

    for (i = 0; i < categories.length; i++) {
        var button = document.createElement('button');
            button.textContent = categories[i];
            button.dataset.category = categories[i];
            button.addEventListener("click", function() {
                config.currentTab = this.dataset.category;
                createItemButtons();
            });
        document.getElementById('categories').appendChild(button);
    }
}

function createItemButtons() {
    var itemDiv = document.getElementById('items');
    itemDiv.innerHTML = '';

    for (i = 0; i < menu[config.currentTab].length; i++) {
        var item = menu[config.currentTab][i];
        var itemButton = document.createElement('div');
            itemButton.dataset.item = item.name;
            itemButton.className = 'itemButton';
            itemButton.textContent = item.name;
            itemButton.dataset.target = i;
            itemButton.addEventListener("click", function() {
                addToCart(this.dataset.target);
            });
        itemDiv.appendChild(itemButton);
    }
}

function addToCart(itemIndex) {
    var item = menu[config.currentTab][itemIndex];

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
        itemEntry.textContent = shoppingCart[i].name;
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

}

// Helper Functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function removeSpaces(str) {
    return str.replace(/\s+/g, '-');
}

init();