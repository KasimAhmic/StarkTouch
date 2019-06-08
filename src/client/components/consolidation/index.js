// Electron
const { ipcRenderer } = require('electron');
var request = require("request");

// Global Variables
var orderProgress;
var orderReady;
var config;
var orderList = {};

// Initializes this script.
function init() {
    [config, orderProgress, orderReady] = ipcRenderer.sendSync('config-order');
    addProgressOrders();
    addReadyOrders();
}

// Adds orders to the in progress column.
function addProgressOrders() {
    var numberList = document.getElementById('order-list-progress');
    var nameList = document.getElementById('name-list-progress');
    numberList.innerHTML = '';
    nameList.innerHTML = '';

    var orders = Object.keys(orderProgress);

    for (i = 0; i < orders.length; i++) {
        var number = document.createElement('li');
            number.textContent = orderProgress[String(i)].number;
            number.dataset.category = Object.keys(orderProgress)[i];
        var name = document.createElement('li');
            name.textContent = orderProgress[String(i)].name;
            name.dataset.category = Object.keys(orderProgress)[i];
        document.getElementById('order-list-progress').appendChild(number);
        document.getElementById('name-list-progress').appendChild(name);
    }
}

// Adds an order to the ready column.
function addReadyOrders() {
    var numberList = document.getElementById('order-list-ready');
    var nameList = document.getElementById('name-list-ready');
    numberList.innerHTML = '';
    nameList.innerHTML = '';

    var orders = Object.keys(orderReady);

    for (i = 0; i < orders.length; i++) {
        var number = document.createElement('li');
            number.textContent = orderReady[String(i)].number;
            number.dataset.category = Object.keys(orderReady)[i];
        var name = document.createElement('li');
            name.textContent = orderReady[String(i)].name;
            name.dataset.category = Object.keys(orderReady)[i];
        document.getElementById('order-list-ready').appendChild(number);
        document.getElementById('name-list-ready').appendChild(name);
    }
}

init();
