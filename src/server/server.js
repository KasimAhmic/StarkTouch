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
           INSERT INTO order_stats (restaurant_id, order_date, dine_in, pretax_total, tax_rate, grand_total) VALUES ('${config.restaurant.id}', curdate(), '${order.dineIn ? 1 : 0}', ${order.subtotal}, ${order.tax}, ${order.total});
           SELECT @orderstats_id := MAX(order_id)
           FROM order_stats;`;
    var sqlMid = ``;
    var sqlEnd = `COMMIT;SET autocommit=1;`

    for (i = 0; i < order.cart.length; i++) {
        if (order.cart[i].type == 'entree') {
            sqlMid += `INSERT INTO ordered_entree (order_stats_id, entree_ordered) VALUES (@orderstats_id, '${order.cart[i].id}');`;
        } else if (order.cart[i].type == 'side') {
            sqlMid += `INSERT INTO ordered_side (order_stats_id, side_ordered) VALUES (@orderstats_id, '${order.cart[i].id}');`;
        } else if (order.cart[i].type == 'dessert') {
            sqlMid += `INSERT INTO ordered_dessert (order_stats_id, dessert_ordered) VALUES (@orderstats_id, '${order.cart[i].id}');`;
        } else if (order.cart[i].type == 'drink') {
            sqlMid += `INSERT INTO ordered_drink (order_stats_id, drink_ordered) VALUES (@orderstats_id, '${order.cart[i].id}');`;
        }
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

//app.post('/test', function(req, res) {
//    var sql = `INSERT INTO order_stats (restaurant_id, dine_in, order_out) VALUES ('1', '1', '` + new Date().toISOString().slice(0, 19).replace('T', ' ') + `');`
//    console.log(sql)
//    con.query(sql, function(err, result) {
//        if (err) throw err;
//
//        console.log('Sent')
//    })
//});

app.get('/getMenu', function(req, res) {
    var sql = `SELECT JSON_OBJECT (
        "0", JSON_OBJECT (
            "name", "Entrees",
            "items", (
                SELECT CAST(
                    CONCAT("[",
                        GROUP_CONCAT(
                            JSON_OBJECT (
                                "id", entree_id,
                                "name", description,
                                "cost", entree_cost,
                                "active", active,
                                "type", "entree"
                            )
                        ),
                    "]") AS JSON
                ) FROM entree
            )
        ),
        "1", JSON_OBJECT (
            "name", "Sides",
            "items", (
                SELECT CAST(
                    CONCAT("[",
                        GROUP_CONCAT(
                            JSON_OBJECT (
                                "id", side_id,
                                "name", description,
                                "cost", side_cost,
                                "active", active,
                                "type", "side"
                            )
                        ),
                    "]") AS JSON
                ) FROM side
            )
        ),
        "2", JSON_OBJECT (
            "name", "Desserts",
            "items", (
                SELECT CAST(
                    CONCAT("[",
                        GROUP_CONCAT(
                            JSON_OBJECT (
                                "id", dessert_id,
                                "name", description,
                                "cost", dessert_cost,
                                "active", active,
                                "type", "dessert"
                            )
                        ),
                    "]") AS JSON
                ) FROM dessert
            )
        ),
        "3", JSON_OBJECT (
            "name", "Drinks",
            "items", (
                SELECT CAST(
                    CONCAT("[",
                        GROUP_CONCAT(
                            JSON_OBJECT (
                                "id", drink_id,
                                "name", description,
                                "cost", drink_cost,
                                "active", active,
                                "type", "drink"
                            )
                        ),
                    "]") AS JSON
                ) FROM drink
            )
        )
    );`;

    con.query(sql, function(err, result) {
        if (err) throw err;
        var parsedJSON = {};

        for (i = 0; i < result.length; i++) {
            parsedJSON = ((Object.values(result[i])[0]));
        }

        res.end(JSON.stringify(parsedJSON));
    });
});

app.get('/getIncompleteOrder', function(req, res) {
    var sql = `START TRANSACTION;
	    SELECT @max_order := MAX(order_id) FROM order_stats;
	    SELECT * FROM ordered_${req.body.terminal} WHERE order_stats_id > @max_order - ${req.body.maxCols} AND ${req.body.terminal}_end IS NULL;
    COMMIT;`

    con.query(sql, function(err, result) {
        if (err) throw err;

        var orders = [];
        var currentOrder = null;

        for (i = 0; i < result[2].length; i++) {
            if (result[2][i].order_stats_id % 999 != currentOrder) {
                orders.push({orderNumber: result[2][i].order_stats_id % 999, items: [], orderId: result[2][i].order_stats_id});
            }
            currentOrder = result[2][i].order_stats_id % 999;
        }
        for (i = 0; i < result[2].length; i++) {
            for (x = 0; x < orders.length; x++) {
                if (result[2][i].order_stats_id % 999 == orders[x].orderNumber) {
                    orders[x].items.push(result[2][i][req.body.terminal + '_ordered']);
                }
            }
        }

        res.end(JSON.stringify(orders))
    });
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