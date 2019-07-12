// Electron
const { ipcRenderer } = require('electron');

// Global Variables
var menu;
var config;
var shoppingCart = [];
var toppingList = [];

// Main Functions
function init() {
    config = ipcRenderer.sendSync('request-config');
    menu = JSON.parse(ipcRenderer.sendSync('getMenu'));

    createTopButtons();
    createMenuItems();
    createPaymentButtons(false);
}

function createTopButtons() {
    var mainMenu = document.getElementById('main-menu');
        mainMenu.addEventListener('click', function() {
            ipcRenderer.sendSync('load-main-menu');
        });
    var resetOrder = document.getElementById('reset-order');
        resetOrder.addEventListener('click', function() {
            toppingList = [];
            shoppingCart = [];
            updateCart();
            createMenuItems();
        });
    var creditCard = document.getElementById('money-type');
        creditCard.addEventListener('click', function() {
            if (this.style.opacity == 1.0) {
                this.style.opacity = 0.5;
                createPaymentButtons(true);
            } else {
                this.style.opacity = 1.0;
                createPaymentButtons(false);
            }
        });
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
function createPaymentButtons(cardOption) {
    var confirmButton = document.getElementById('confirm-amount');
    var paymentDiv = document.getElementById('card-payments');
        paymentDiv.innerHTML = '';
    // If customer would like to pay with a credit card.
    if (cardOption) {
        paymentDiv.innerHTML = `
            <div id="dropin-wrapper">
                <div id="checkout-message"></div>
                <div id="dropin-container"></div>
            </div>
        `;
        //Adds braintree dropin to payment screen
        braintree.dropin.create({
            authorization: 'sandbox_kt2ct7tw_4vbx9dbhxsyjqq62', // tokenization_key will need to be modified for future merchants
            container: '#dropin-container',
            card: {
                overrides: {
                    fields: {
                        number: {
                            placeholder: "**** **** **** ****" // Fix for symbols bug
                        }
                    }
                }
            }
        }, function (createErr, instance) {
            // Only allow ordering when braintree is setup
            confirmButton.addEventListener('click', function() {
                submitOrder(shoppingCart, instance);
            });
        });
    }
    var amountPaying = '';
    var amountDiv = document.getElementById('amount').getElementsByTagName('span')[0];
    var cancelButton = document.getElementById('cancel-button');
        cancelButton.addEventListener('click', function() {
            amountPaying = '';
            amountDiv.innerText = '$0.00';
        });
        confirmButton.addEventListener('click', function() {
            submitOrder(shoppingCart);
            openRegister();
        });
    var openButton = document.getElementById('open-button');
        openButton.addEventListener('click', function() {
            openRegister();
        });
    var moneyButtons = document.getElementById('money-buttons').getElementsByClassName('payment-button');
        moneyButtons[0].addEventListener('click', function() {
            if (isNaN(parseFloat(amountPaying))) {
                amountPaying = '0';
            }
            var temp = parseFloat(amountPaying) + 1.0;
            amountPaying = temp.toFixed(2).toString();
            amountDiv.innerText = '$' + amountPaying;
        });
        moneyButtons[1].addEventListener('click', function() {
            if (isNaN(parseFloat(amountPaying))) {
                amountPaying = '0';
            }
            var temp = parseFloat(amountPaying) + 5.0;
            amountPaying = temp.toFixed(2).toString();
            amountDiv.innerText = '$' + amountPaying;
        });
        moneyButtons[2].addEventListener('click', function() {
            if (isNaN(parseFloat(amountPaying))) {
                amountPaying = '0';
            }
            var temp = parseFloat(amountPaying) + 10.0;
            amountPaying = temp.toFixed(2).toString();
            amountDiv.innerText = '$' + amountPaying;
        });
        moneyButtons[3].addEventListener('click', function() {
            if (isNaN(parseFloat(amountPaying))) {
                amountPaying = '0';
            }
            var temp = parseFloat(amountPaying) + 20.0;
            amountPaying = temp.toFixed(2).toString();
            amountDiv.innerText = '$' + amountPaying;
        });
        moneyButtons[4].addEventListener('click', function() {
            amountPaying = parseFloat(amountPaying);
            amountPaying = Math.floor(amountPaying);
            amountPaying = amountPaying.toFixed(2).toString();
            amountDiv.innerText = '$' + amountPaying;
        });
        moneyButtons[5].addEventListener('click', function() {
            amountPaying = amountPaying + '.';
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
            amountPaying += e.key;
            amountDiv.innerText = '$' + amountPaying;
        } else if (e.key == '.') {
            amountPaying = amountPaying + '.';
            amountDiv.innerText = '$' + amountPaying;
        }
    });
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
function submitOrder(cart, braintreeInstance) {
    [subtotal, tax, total] = calculateTotals();
    var name = document.getElementById('name-form').value;

    if (braintreeInstance === undefined) {
        ipcRenderer.send('submitOrder', name, cart, subtotal, tax, total);
    } else {
        // Requests credit card payment method via braintree dropin
        braintreeInstance.requestPaymentMethod(function (requestPaymentMethodErr, payload) {

            braintreeInstance.teardown(function (teardownErr) {
                if (teardownErr) {
                    console.error('Could not tear down Drop-in UI!');
                } else {
                    console.info('Drop-in UI has been torn down!');
                }
            });
            // Only send request if the payment was successful
            if (requestPaymentMethodErr) {
                console.error(requestPaymentMethodErr);
                return;
            }
            ipcRenderer.send('submitOrder', name, cart, subtotal, tax, total, payload.nonce);
        });
    }
}

ipcRenderer.on('submitOrderResponse', (event, res, success) => {
    console.log(res);

    if (success) {
        setTimeout(function() {
            ipcRenderer.send('load-register');
        }, 5000);
    } else {
        alert('Payment declined.');
    }
});

// Helper Functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function removeSpaces(str) {
    return str.replace(/\s+/g, '-');
}

init();
