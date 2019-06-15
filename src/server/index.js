const express = require('express');
const bodyParser = require('body-parser');
var mysql = require('mysql');

const app = express();

var database = 60;
var config = require('./config.json')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.post('/submitOrder', function(req, res) {
    var order = {
        "name": req.body.name,
        "orderNumber": generateOrderNumber(),
        "cart": req.body.cart,
        "total": req.body.total
    }
    console.log(JSON.stringify(order))

    //res.send(`Thank you ${name}! Your order number is ${orderNumber} and will be ready shortly!`);
    res.setHeader('Content-Type', 'application/json');

    var con = mysql.createConnection({
        // INSERT SQL CONNECTION INFORMATION HERE
    });

    //con.connect(function(err) {
    //    if (err) throw err;
    //
    //    var sql = "INSERT INTO order_stats (restaurant_id, order_date, dine_in, order_code, total_cost) VALUES ('1', curdate(), '1', '" + (database % 999) + "', '" + order.total + "');";
    //
    //    con.query(sql, function (err, result) {
    //        if (err) throw err;
    //        console.log("Table created");
    //    });
    //});

    res.end(JSON.stringify(order));
});

app.listen(3000, function(err) {
    if (err) {
        throw err;
    }

    console.log('Server started on port 3000.');
});

function generateOrderNumber() {
    /*
     * This function needs to query the size of a table that stores order information. It simply needs to get the number of entires and 
     * modulo it by 999 to get the current order number. The 999 comes from a rotating limit of 1000 orders per day. The database will store
     * orders using an auto incrementing primary key and the order number stored in the database will be used almost exclussively for the
     * customer knowing which order is theirs.
     * 
     * Example:
     * If table size is 576, 657 % 999 = 576 so the order number is 576
     * If table size is 8945, 8945 % 999 = 953 so the order number is 953
     */
    if ((database + 1) > 999) {
        database = 1;
        return String(database);
    }
    database++;
    return String(database);
}