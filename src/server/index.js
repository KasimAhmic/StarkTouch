const express = require('express');
const bodyParser = require('body-parser');

const app = express();

var database = 60;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/getOrderNumber', function(req, res) {
    res.send(generateOrderNumber());
});

app.post('/submitOrder', function(req, res) {
    var cart = req.body.cart;
    var name = req.body.name;
    var orderNumber = req.body.orderNumber;

    res.set('Content-Type', 'text/plain');
    res.send(`Thank you ${name}! Your order number is ${orderNumber} and will be ready shortly!`);
});

app.listen(3000, function(err) {
    if (err) {
        throw err;
    }

    console.log('Server started on port 3000.');
});

function generateOrderNumber() {
    if ((database + 1) > 999) {
        database = 1;
        return String(database);
    }
    database++;
    console.log(database)
    return String(database);
}