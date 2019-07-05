const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const con = require('./connection.js');
const config = require('./config.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/submitOrder', function(req, res) {
    var order = {
        "name": req.body.name,
        "cart": JSON.parse(req.body.cart),
        "total": req.body.total,
        "dineIn": req.body.dineIn,
        "subtotal": req.body.subtotal,
        "tax": req.body.tax,
        "total": req.body.total
    };
    var sqlStart = `SET autocommit = 0;
        START TRANSACTION;
           INSERT INTO order_stats (restaurant_id, order_date, dine_in, pretax_total, tax_rate, grand_total) VALUES ('${config.restaurant.id}', '${new Date().toISOString().slice(0, 19).replace('T', ' ')}', '${order.dineIn ? 1 : 0}', ${order.subtotal}, ${order.tax}, ${order.total});
           SELECT @orderstats_id := MAX(order_id)
           FROM order_stats;`;
    var sqlMid = ``;
    var sqlEnd = `COMMIT;SET autocommit=1;`

    for (i = 0; i < order.cart.length; i++) {
        var type = order.cart[i].type;
        sqlMid += `INSERT INTO ordered_${type} (order_stats_id, ${type}_ordered, ${type}_start) VALUES (@orderstats_id, '${order.cart[i].id}', '${new Date().toISOString().slice(0, 19).replace('T', ' ')}');`;
    }

    var finalSql = sqlStart + sqlMid + sqlEnd;

    con.query(finalSql, function(err, result) {
        if (err) throw err;
        console.log("Order submitted.");
    }).on('end', function() {
        generateOrderNumber(function(number) {
            res.end(`Thank you ${order.name}! Your order number is ${number} and will be ready shortly!`);
        });
    });
});

app.get('/getMenu', function(req, res) {
    var sql = `START TRANSACTION;SELECT * FROM entree;SELECT * FROM side;SELECt * FROM drink;SELECT * from dessert;COMMIT;`

    con.query(sql, function(err, result) {
        if (err) throw err;
        result.shift(); // Remove first entry in result object
        result.pop();   // Remove last entry in result object

        var parsedJSON = {}; // Create new object

        for (i = 0; i < result.length; i++) {                           // Loop through result object
            var id = Object.keys(result[i][0])[0].slice(0,-3);          // Get the id column name
            var name = id.charAt(0).toUpperCase() + id.slice(1) + 's';  // Format the id
            parsedJSON[i] = {"name": name, "items": result[i]};         // Populate the previously created object
        }

        res.end(JSON.stringify(parsedJSON));
    })
});

app.get('/getIncompleteOrder', function(req, res) {
    var sql = `SELECT * FROM ordered_${req.body.type} WHERE ${req.body.type}_end IS NULL;`;

    con.query(sql, function(err, result) {
        if (err) throw err;

        var orders = [];
        var currentOrder = null;

        for (i = 0; i < result.length; i++) {
            if (result[i].order_stats_id % 999 != currentOrder) {
                orders.push({orderNumber: result[i].order_stats_id % 999, items: [], orderId: result[i].order_stats_id});
            }
            currentOrder = result[i].order_stats_id % 999;
        }
        for (i = 0; i < result.length; i++) {
            for (x = 0; x < orders.length; x++) {
                if (result[i].order_stats_id % 999 == orders[x].orderNumber) {
                    orders[x].items.push(result[i][req.body.type + '_ordered']);
                }
            }
        }

        res.end(JSON.stringify(orders))
    });
});

app.post('/completeOrder', function(req, res) {
    var sql = `UPDATE ordered_${req.body.type} SET ${req.body.type}_end = '${new Date().toISOString().slice(0, 19).replace('T', ' ')}' WHERE order_stats_id = ${req.body.orderId}`;
    con.query(sql, function(err, result) {
        if (err) throw err;
    });

    res.end(req.body.orderId);
});

app.listen(3000, function(err) {
    if (err) {
        throw err;
    }

    console.log('Server started on port 3000.');
});

function generateOrderNumber(callback) {
    var sql = `SELECT MAX(order_id) FROM order_stats`;
    con.query(sql, function(err, result) {
        if (err) throw err;
        Object.keys(result).forEach(function(key) {
            var row = result[key];
            callback(Object.values(row)[0] % 999);
        });
    });
}