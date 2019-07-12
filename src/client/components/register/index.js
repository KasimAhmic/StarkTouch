// Electron
const { ipcRenderer } = require('electron');

// Global Variables
var menu;
var config;
var shoppingCart = [];
var toppingList = [];

// Debug
var dubug;

// Main Functions
function init() {
    // Debug related initilization
    debug = ipcRenderer.sendSync('request-debug');
    if (debug) {runDebug()}

    config = ipcRenderer.sendSync('request-config');
    menu = JSON.parse(ipcRenderer.sendSync('getMenu'));
    console.log(menu);

    createMenuItems();
    createPaymentButtons();
}

// Adds event listeners to menu items
function createMenuItems() {
    var menuEntrees = document.getElementById('Entrees');
        menuEntrees.innerHTML = '';
    var menuSides = document.getElementById('Sides');
        menuSides.innerHTML = '';
    var menuDrinks = document.getElementById('Drinks');
        menuDrinks.innerHTML = '';
    var menuDesserts = document.getElementById('Desserts');
        menuDesserts.innerHTML = '';
    var menuToppings = document.getElementById('toppings');
        menuToppings.innerHTML = '';
    var confirmation = document.getElementById('confirmation');
        confirmation.innerHTML = '';
        
    for (var i = 0; i <= 7; i++) {
        var menuItem = menu[0].items[i];
        var entree = document.createElement('div');
            entree.className = 'menu-button';
            entree.dataset.target = i;
            entree.addEventListener("click", function() {
                selectToppings(this.dataset.target);
            });
        var span = document.createElement('span');
            span.textContent = menuItem.description;
        entree.appendChild(span);
        menuEntrees.appendChild(entree);
    }

    for (var i = 0; i <= 5; i++) {
        var menuItem = menu[1].items[i];
        var side = document.createElement('div');
            side.className = 'menu-button';
            side.dataset.target = i;
            side.addEventListener("click", function() {
                addToCart(this.dataset.target, 1);
            });
        var span = document.createElement('span');
            span.textContent = menuItem.description;
        side.appendChild(span);
        menuSides.appendChild(side);
    }

    for (var i = 0; i <= 8; i++) {
        var menuItem = menu[2].items[i];
        var drink = document.createElement('div');
            drink.className = 'menu-button';
            drink.dataset.target = i;
            drink.addEventListener("click", function() {
                addToCart(this.dataset.target, 2);
            });
        var span = document.createElement('span');
            span.textContent = menuItem.description;
        drink.appendChild(span);
        menuDrinks.appendChild(drink);
    }

    for (var i = 0; i <= 1; i++) {
        var menuItem = menu[3].items[i];
        var dessert = document.createElement('div');
            dessert.className = 'menu-button';
            dessert.dataset.target = i;
            dessert.addEventListener("click", function() {
                addToCart(this.dataset.target, 3);
            });
        var span = document.createElement('span');
            span.textContent = menuItem.description;
        dessert.appendChild(span);
        menuDesserts.appendChild(dessert);
    }

    var confirmButton = document.createElement('div');
        confirmButton.id = 'confirm-button';
    var confirmSpan = document.createElement('span');
        confirmSpan.textContent = 'CONFIRM';
    confirmButton.appendChild(confirmSpan);
    confirmation.appendChild(confirmButton);
}

// Allows user to select entree toppings
function selectToppings(entree) {
    toppingList = [];
    var menuToppings = document.getElementById('toppings');
    var toppings = ['Lettuce', 'Tomato', 'Onion', 'Pickle', 'Jalapeno', 'Bacon', 'Ketchup', 'Mustard', 'Mayonnaise'];

    for (var i = 0; i < toppings.length; i++) {
        var topping = document.createElement('div');
            topping.className = 'topping-button';
            topping.id = toppings[i];
            topping.addEventListener("click", function() {
                if (this.style.opacity == 0.5) {
                    this.style.opacity = 1.0;
                    updateToppings(false, this.id);
                } else {
                    this.style.opacity = 0.5;
                    updateToppings(true, this.id);
                }
            });
        var span = document.createElement('span');
            span.textContent = toppings[i];
        topping.appendChild(span);
        menuToppings.appendChild(topping);
    }

    var confirmButton = document.getElementById('confirm-button');
        confirmButton.addEventListener('click', function() {
            addToCart(entree, 0);
            createMenuItems();
        });
}

// Adds the selected toppings to the shopping cart
function updateToppings(answer, topping) {
    var index = toppingList.indexOf(topping);
    if (answer) {
        toppingList.push(topping);
    } else {
        toppingList.splice(index, 1);
    }
}

// Adds event listeners to the payment buttons
function createPaymentButtons() {
    var amountPaying = 0.0;
    var amountDiv = document.getElementById('amount').getElementsByTagName('span')[0];
    var cancelButton = document.getElementById('cancel-button');
        cancelButton.addEventListener('click', function() {
            amountPaying = 0.0;
            amountDiv.innerText = '$0.00';
        });
    var confirmButton = document.getElementById('confirm-amount');
        confirmButton.addEventListener('click', function() {
            processPayment();
            openRegister();
        });
    var openButton = document.getElementById('open-button');
        openButton.addEventListener('click', function() {
            openRegister();
        });
    var moneyButtons = document.getElementById('money-buttons').getElementsByClassName('payment-button');
        moneyButtons[0].addEventListener('click', function() {
            amountPaying += 1;
            amountDiv.innerText = '$' + amountPaying.toFixed(2);
        });
        moneyButtons[1].addEventListener('click', function() {
            amountPaying += 5;
            amountDiv.innerText = '$' + amountPaying.toFixed(2);
        });
        moneyButtons[2].addEventListener('click', function() {
            amountPaying += 10;
            amountDiv.innerText = '$' + amountPaying.toFixed(2);
        });
        moneyButtons[3].addEventListener('click', function() {
            amountPaying += 20;
            amountDiv.innerText = '$' + amountPaying.toFixed(2);
        });
        moneyButtons[4].addEventListener('click', function() {
            amountPaying = Math.floor(amountPaying);
            amountDiv.innerText = '$' + amountPaying.toFixed(2);
        });
        moneyButtons[5].addEventListener('click', function() {
            amountPaying = amountPaying.toString() + '.';
            amountDiv.innerText = '$' + amountPaying;
        });
    var numberButtons = document.getElementById('number-buttons').getElementsByClassName('payment-button');
    for (var i = 0; i < numberButtons.length; i++) {
        var numberButton = numberButtons[i];
            numberButton.addEventListener('click', function() {
                amountPaying += parseInt(this.innerText);
                amountDiv.innerText = '$' + amountPaying;
            });
    }
    document.addEventListener('keypress', function(e) {
        var key = parseInt(e.key);
        if (key <= 9 && key >= 0) {
            amountPaying = '';
            amountPaying += e.key;
            amountDiv.innerText = '$' + amountPaying;
        } else if (e.key == '.') {
            amountPaying = amountPaying.toString() + '.';
            amountDiv.innerText = '$' + amountPaying;
        }
    });
}

// Processes Payment
function processPayment() {
    // TO-DO: Create functionality to process payment
    submitOrder(shoppingCart);
}

function openRegister() {
    /*
     *  Normally there would be a function
     *  to open up the register, but there
     *  isn't an actual register. So, just
     *  assume that the register would open
     *  up as intended.
     *                                      */
}

// Adds item to cart
function addToCart(itemIndex, number) {
    var item = menu[number].items[itemIndex];
    if (number == 0) {
        var tempObject = {
            id: Object.values(item)[0],
            type: Object.keys(item)[0].slice(0,-3),
            name: item.description,
            price: Object.values(item)[4],
            toppings: toppingList
        };
    }
    else {
        var tempObject = {
            id: Object.values(item)[0],
            type: Object.keys(item)[0].slice(0,-3),
            name: item.description,
            price: Object.values(item)[4]
        };
    }
    shoppingCart.push(tempObject);
    updateCart();
}

// Updates the contents of the cart
function updateCart() {
    var cartContainer = document.getElementById('cart');
    var entryContainer;
    var removeButton;
    var itemName;
    var itemPrice;
    var itemToppings;

    cartContainer.innerHTML = '';

    for (i = 0; i < shoppingCart.length; i ++) {
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
        entryContainer.appendChild(itemName);
        entryContainer.appendChild(itemPrice);

        // Item Toppings - still needs work done.
        if (shoppingCart[i].type == 'entree') {
            for (j = 0; j < shoppingCart[i].toppings.length; j++) {
                itemToppings = document.createElement('span');
                itemToppings.className = 'cart-item-name';
                itemToppings.id = 'cart-item-topping';
                itemToppings.innerHTML = '<br>' + shoppingCart[i].toppings[j];
                entryContainer.appendChild(itemToppings);
            }
        }

        // Append entry container to shopping cart
        cartContainer.appendChild(entryContainer);
  }

  updateTotals();
}

// Removes item from cart
function removeFromCart(name, index) {
    document.getElementById('cart').querySelector('[data-name=' + name + ']').remove();
    shoppingCart.pop(index);
    updateTotals();
}

// Updates the total amount for the order
function updateTotals() {
    [subtotal, tax, total] = calculateTotals();
    shoppingCart.total = total;

    document.getElementById('subtotal').innerText = '$' + subtotal;
    document.getElementById('tax').innerText = '$' + tax;
    document.getElementById('total').innerText = '$' + total;
    //document.getElementById('amount').getElementsByTagName('span')[0].innerText = '$' + total;
}

// Calculates taxes for the order
function calculateTotals() {
    var subtotal = 0.0;
    var tax = 0.0;
    var total = 0.0;

    for (var i = 0; i < shoppingCart.length; i++) {
        subtotal += parseFloat((shoppingCart[i].price));
        tax = subtotal * 0.07;
        total = subtotal + tax;
    }

    return [subtotal.toFixed(2), tax.toFixed(2), total.toFixed(2)];
}

// Submits order to the server
function submitOrder(cart) {
    [subtotal, tax, total] = calculateTotals();
    var name = document.getElementById('name-form').value;
    ipcRenderer.send('submitOrder', name, cart, subtotal, tax, total);
}

ipcRenderer.on('submitOrderResponse', (event, res) => {
    console.log(res);

    setTimeout(function() {
        ipcRenderer.send('load-kiosk');
    }, 5000);
});

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
