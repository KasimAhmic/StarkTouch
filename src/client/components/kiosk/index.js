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
    menu = JSON.parse(ipcRenderer.sendSync('request-menu'));

    createCategoryButtons();
    createItemButtons(config.kiosk.currentTab);

    document.getElementById('submit').addEventListener('click', function() {
        reviewOrder();
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

    var submitButton = document.getElementById('submit');
    submitButton.innerHTML = 'Review Order';

    for (i = 0; i < menu[currentTab].items.length; i++) {
        var item = menu[currentTab].items[i];
        var itemButton = document.createElement('div');
            itemButton.className = 'itemButton animated fadeInLeft faster';
            itemButton.dataset.item = item.name;
            itemButton.dataset.target = i;
            itemButton.style.backgroundImage = 'url(\'images/items/' + menu[currentTab].name + '/' + item.name + '.jpg\')';
            itemButton.addEventListener("click", function() {
                if (menu[currentTab].name == 'Entrees') {
                    selectToppings(this.dataset.target);
                }
                else {
                    addToCart(this.dataset.target);
                }
                this.className = 'itemButton animated bounce fast';
            });
            itemButton.addEventListener('animationend', function() {
                this.classList.remove('bounce');
            });
        var itemPrice = document.createElement('span');
            itemPrice.className = 'list-item-price';
            itemPrice.textContent = '$' + item.cost;
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

// Creates the topping selection screen once an entree is chosen
function selectToppings(entree) {
    var currentTab = Object.values(config.kiosk.currentTab);
    var itemDiv = document.getElementById('items');
    var toppings = ['Lettuce', 'Tomato', 'Onion', 'Pickle', 'Jalapeno', 'Bacon', 'Ketchup', 'Mustard', 'Mayonnaise'];

    itemDiv.innerHTML = '';

    var submitButton = document.getElementById('submit');
    submitButton.innerHTML = 'Review Order';

    for (i = 0; i < toppings.length; i++) {
        var topping = toppings[i];
        var toppingButton = document.createElement('div');
            toppingButton.className = 'itemButton animated fadeInLeft faster';
            toppingButton.id = 'topping';
            toppingButton.dataset.item = toppings[i];
            toppingButton.dataset.target = i;
            toppingButton.style.backgroundImage = 'url(\'images/items/Toppings/' + topping + '.jpg\')';
            toppingButton.addEventListener("click", function() {
                this.className = 'itemButton animated bounce fast';
                this.style.opacity = 0.5;
                appendTopping();
            });
            toppingButton.addEventListener('animationend', function() {
                this.classList.remove('bounce');
            });
        var itemName = document.createElement('span');
            itemName.className = 'list-item-name';
            itemName.textContent = toppings[i];
        toppingButton.appendChild(itemName);
        itemDiv.appendChild(toppingButton);
    }

    var noButton = document.createElement('div');
        noButton.className = 'itemButton animated fadeInLeft faster';
        noButton.id = 'noButton';
        noButton.style.backgroundImage = 'url(\'no.png\')';
        noButton.addEventListener("click", function() {
            this.className = 'itemButton animated bounce fast';
            createItemButtons();
        });
        noButton.addEventListener('animationend', function() {
            this.classList.remove('bounce');
        });
    var yesButton = document.createElement('div');
        yesButton.className = 'itemButton animated fadeInLeft faster';
        yesButton.id = 'noButton';
        yesButton.style.backgroundImage = 'url(\'yes.png\')';
        yesButton.addEventListener("click", function() {
            this.className = 'itemButton animated bounce fast';
            addToCart(entree);
            createItemButtons();
        });
        yesButton.addEventListener('animationend', function() {
            this.classList.remove('bounce');
        });

    var no = document.createElement('span');
        no.className = 'list-item-name';
        no.textContent = 'NO';
    var yes = document.createElement('span');
        yes.className = 'list-item-name';
        yes.textContent = 'YES';

    noButton.appendChild(no);
    yesButton.appendChild(yes);
    itemDiv.appendChild(noButton);
    itemDiv.appendChild(yesButton);

    itemDiv.querySelectorAll('.list-item-name').forEach((name) => {
        var height = name.offsetHeight;
        name.style.paddingTop = (height / 2) + 'px';
        name.style.paddingBottom = (height / 2) + 'px';
    });
}

// Adds the selected toppings to the shopping cart
function appendTopping() {
    //TODO: append topping to shopping cart.
}

// Creates confirmation screen.
function createConfirmationScreen() {
    var currentTab = Object.values(config.kiosk.currentTab);
    var itemDiv = document.getElementById('items');

    itemDiv.innerHTML = '';

    var submitButton = document.getElementById('submit');
    submitButton.innerHTML = 'Review Order';

    var comment = document.createElement('span');
        comment.innerHTML = 'Does everything in your order look correct?';
        comment.className = 'confirmation-comment';

    var noButton = document.createElement('div');
        noButton.className = 'itemButton animated fadeInLeft faster';
        noButton.id = 'noButton';
        noButton.style.backgroundImage = 'url(\'no.png\')';
        noButton.addEventListener("click", function() {
            this.className = 'itemButton animated bounce fast';
            createItemButtons();
        });
        noButton.addEventListener('animationend', function() {
            this.classList.remove('bounce');
        });
    var yesButton = document.createElement('div');
        yesButton.className = 'itemButton animated fadeInLeft faster';
        yesButton.id = 'noButton';
        yesButton.style.backgroundImage = 'url(\'yes.png\')';
        yesButton.addEventListener("click", function() {
            this.className = 'itemButton animated bounce fast';
            createPaymentScreen();
        });
        yesButton.addEventListener('animationend', function() {
            this.classList.remove('bounce');
        });

    var no = document.createElement('span');
        no.className = 'list-item-name';
        no.textContent = 'NO';
    var yes = document.createElement('span');
        yes.className = 'list-item-name';
        yes.textContent = 'YES';

    noButton.appendChild(no);
    yesButton.appendChild(yes);
    itemDiv.appendChild(comment);
    itemDiv.appendChild(noButton);
    itemDiv.appendChild(yesButton);

    itemDiv.querySelectorAll('.list-item-name').forEach((name) => {
        var height = name.offsetHeight;
        name.style.paddingTop = (height / 2) + 'px';
        name.style.paddingBottom = (height / 2) + 'px';
    });
}

// Creates payment screen.
function createPaymentScreen() {
    var currentTab = Object.values(config.kiosk.currentTab);
    var itemDiv = document.getElementById('items');

    itemDiv.innerHTML = '';

    document.getElementById('submit').addEventListener('click', function() {
        submitOrder();
    });

    var submitButton = document.getElementById('submit');
    submitButton.innerHTML = 'Submit Order';

    var nameDiv = document.createElement('div');
    var paymentDiv = document.createElement('div');

    var form1 = document.createElement('form');
    var form2 = document.createElement('form');

    var comment1 = document.createElement('span');
        comment1.innerHTML = 'Please enter a name for this order:';
        comment1.className = 'confirmation-comment';
    var comment2 = document.createElement('span');
        comment2.innerHTML = 'Please enter your card:';
        comment2.id = 'payment-comment';
    var nameInput = document.createElement('input');
        nameInput.id = 'name-form';
        nameInput.type = 'text';
        nameInput.name = 'name';
        nameInput.size = 50;
    var image = document.createElement('img');
        image.src = 'images/payment.png';
        image.id = 'payment-options';

    form1.appendChild(nameInput);
    form2.appendChild(image);
    nameDiv.appendChild(comment1);
    nameDiv.appendChild(form1);
    paymentDiv.appendChild(comment2);
    paymentDiv.appendChild(form2);
    itemDiv.appendChild(nameDiv);
    itemDiv.appendChild(paymentDiv);

    // TO-DO: Figure out way to invoke payment process.
}

// Processes Payment
function processPayment() {
    // TO-DO: Create functionality to process payment
    submitOrder(shoppingCart);
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
    var itemPrice;

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
        subtotal += parseFloat((shoppingCart[i].cost));
        tax = subtotal * 0.07;
        total = subtotal + tax;
    }

    return [subtotal.toFixed(2), tax.toFixed(2), total.toFixed(2)];
}

function reviewOrder() {
    createConfirmationScreen();
}

function submitOrder(cart) {
    [subtotal, tax, total] = calculateTotals();
    ipcRenderer.send('submitOrder', cart, total);
    ipcRenderer.send('load-kiosk');
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
