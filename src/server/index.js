/*
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {

    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Hello Worsld\n');
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
*/

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.post('/submitOrder', function(req, res) {
    var cart = req.body.cart;
    var name = req.body.name;
    var orderNumber = req.body.orderNumber;

    res.set('Content-Type', 'text/plain');
    console.log(cart);
    res.send(`Thank you ${name}! Your order number is ${orderNumber} and will be ready shortly!`);
});

app.listen(3000, function(err) {
    if (err) {
        throw err;
    }

    console.log('Server started on port 3000.');
})