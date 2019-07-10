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
    console.log(menu)

    createCategoryButtons();
    createItemButtons(config.kiosk.currentTab);

    document.getElementById('review').addEventListener('click', reviewOrder);
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
            itemButton.dataset.item = item.description;
            itemButton.dataset.target = i;
            itemButton.style.backgroundImage = 'url(\'images/items/' + menu[currentTab].name + '/' + item.description + '.jpg\')';
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
            itemPrice.textContent = '$' + item[Object.keys(item)[4]];
        var itemName = document.createElement('span');
            itemName.className = 'list-item-name';
            itemName.textContent = item.description;
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
    toppingList = [];

    for (i = 0; i < toppings.length; i++) {
        var topping = toppings[i];
        var toppingButton = document.createElement('div');
            toppingButton.className = 'itemButton animated fadeInLeft faster';
            toppingButton.id = 'topping';
            toppingButton.dataset.item = toppings[i];
            toppingButton.dataset.target = i;
            toppingButton.style.backgroundImage = 'url(\'images/items/Toppings/' + topping + '.jpg\')';
            toppingButton.addEventListener("click", function() {
                if (this.style.opacity == 0.5) {
                    this.className = 'itemButton animated bounce fast';
                    this.style.opacity = 1.0;
                    updateToppings(false, this.textContent);
                } else {
                    this.className = 'itemButton animated bounce fast';
                    this.style.opacity = 0.5;
                    updateToppings(true, this.textContent);
                }
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
        noButton.id = 'noTopping';
        noButton.style.backgroundImage = 'url(\'images/no.png\')';
        noButton.addEventListener("click", function() {
            this.className = 'itemButton animated bounce fast';
            createItemButtons();
        });
        noButton.addEventListener('animationend', function() {
            this.classList.remove('bounce');
        });
    var yesButton = document.createElement('div');
        yesButton.className = 'itemButton animated fadeInLeft faster';
        yesButton.id = 'yesTopping';
        yesButton.style.backgroundImage = 'url(\'images/yes.png\')';
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
function updateToppings(answer, topping) {
    var index = toppingList.indexOf(topping);
    if (answer) {
        //TODO: append topping to list.
        toppingList.push(topping);
    } else {
        //TODO: remove topping from list.
        toppingList.splice(index, 1);
    }
}

// Creates confirmation screen.
function createConfirmationScreen() {
    var currentTab = Object.values(config.kiosk.currentTab);
    var itemDiv = document.getElementById('items');

    itemDiv.innerHTML = '';

    var comment = document.createElement('span');
        comment.innerHTML = 'Does everything in your order look correct?';
        comment.className = 'confirmation-comment';

    var noButton = document.createElement('div');
        noButton.className = 'itemButton animated fadeInLeft faster';
        noButton.id = 'noButton';
        noButton.style.backgroundImage = 'url(\'images/no.png\')';
        noButton.addEventListener("click", function() {
            this.className = 'itemButton animated bounce fast';
            createItemButtons();
        });
        noButton.addEventListener('animationend', function() {
            this.classList.remove('bounce');
        });
    var yesButton = document.createElement('div');
        yesButton.className = 'itemButton animated fadeInLeft faster';
        yesButton.id = 'yesButton';
        yesButton.style.backgroundImage = 'url(\'images/yes.png\')';
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

    var submitButton = document.getElementById('review');
        submitButton.innerHTML = 'Submit Order';
        submitButton.removeEventListener('click', reviewOrder);
        submitButton.addEventListener('click', function() {
            submitOrder(shoppingCart);
        });

    var load = document.createElement('div');
        load.className = 'circle-loader';
        load.id = 'loader-icon';
    var checkmark = document.createElement('div');
        checkmark.className = 'checkmark draw';
        checkmark.id = 'checkmark-icon';

    load.style.opacity = 0.0;

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
        image.addEventListener('click', function() {
            load.style.opacity = 1.0
            setTimeout(function() {
                var loader = document.getElementById('loader-icon');
                    loader.classList.toggle('load-complete');
                var check = document.getElementById('checkmark-icon');
                    check.style.display = 'inline-block'
            }, 5000);
        });

    form1.appendChild(nameInput);
    form2.appendChild(image);
    nameDiv.appendChild(comment1);
    nameDiv.appendChild(form1);
    paymentDiv.appendChild(comment2);
    paymentDiv.appendChild(form2);
    load.appendChild(checkmark);
    itemDiv.appendChild(nameDiv);
    itemDiv.appendChild(load);
    itemDiv.appendChild(paymentDiv);

    // TO-DO: Figure out way to invoke payment process.
}

// Creates finalization page
function createFinalScreen(name, orderNum) {
    var currentTab = Object.values(config.kiosk.currentTab);
    var itemDiv = document.getElementById('items');

    itemDiv.innerHTML = '';

    var thankDiv = document.createElement('div');

    var comment1 = document.createElement('span');
        comment1.innerHTML = 'Thank you ' + name + ' for placing your order!<br><br>';
        comment1.className = 'confirmation-comment';

    var comment2 = document.createElement('span');
        comment2.innerHTML = 'Order number ' + orderNum + ' will be out shortly.';
        comment2.className = 'confirmation-comment';

    thankDiv.appendChild(comment1);
    thankDiv.appendChild(comment2);
    itemDiv.appendChild(thankDiv);
}

// Processes Payment
function processPayment() {
    // TO-DO: Create functionality to process payment
    submitOrder(shoppingCart);
}

function addToCart(itemIndex) {
    var item = menu[config.kiosk.currentTab].items[itemIndex];
    if (config.kiosk.currentTab == 0) {
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

function updateCart() {
    var cartContainer = document.getElementById('cart');
    var entryContainer;
    var removeButton;
    var editButton;
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
        subtotal += parseFloat((shoppingCart[i].price));
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
    var name = document.getElementById('name-form').value;
    ipcRenderer.send('submitOrder', name, cart, subtotal, tax, total);
}

ipcRenderer.on('submitOrderResponse', (event, res) => {
    var res = JSON.parse(res);
    createFinalScreen(res.name, res.orderNumber);

    setTimeout(function() {
        ipcRenderer.send('load-kiosk');
    }, 5000);
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

init();
