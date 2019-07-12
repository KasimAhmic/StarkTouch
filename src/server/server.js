const express = require('express');
const https = require('https');
const http = require('http');
const bodyParser = require('body-parser');
const app = express();
const con = require('./secure/connection.js');
const { readFileSync } = require('fs');
const config = JSON.parse(readFileSync('./config.json'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

http.createServer(app).listen(80, function() {
    console.log('HTTP server started on port 3000.');
});
https.createServer({key: readFileSync('./secure/server.key'), cert: readFileSync('./secure/server.cert')}, app).listen(3000, function() {
    console.log('HTTPS server started on port 3000.')
});

app.get('/', function(req, res) {
    res.send('Hello World!');
});

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
            res.end(JSON.stringify({orderNumber: number, name: order.name}));
        });
    });
});

app.get('/getMenu', function(req, res) {
    var sql = `SELECT * FROM entree; SELECT * FROM side; SELECT * FROM drink; SELECT * from dessert;`

    con.query(sql, function(err, result) {
        if (err) throw err;

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

app.get('/trackOrders', function(req, res) {
    var incompleteOrdersSql = `SELECT order_id FROM order_stats WHERE order_out IS NULL;`;

    con.query(incompleteOrdersSql, function(err, incompleteOrdersResult) {
        if (err) throw err;
        var incompleteItemsSql = ``;

        if (incompleteOrdersResult.length > 0) {
            for (i = 0; i < incompleteOrdersResult.length; i++) {
                incompleteItemsSql += `SELECT order_stats_id, entree_end FROM ordered_entree WHERE order_stats_id = ${incompleteOrdersResult[i].order_id};
                SELECT order_stats_id, side_end FROM ordered_side WHERE order_stats_id = ${incompleteOrdersResult[i].order_id};
                SELECT order_stats_id, dessert_end FROM ordered_dessert WHERE order_stats_id = ${incompleteOrdersResult[i].order_id};
                SELECT order_stats_id, drink_end FROM ordered_drink WHERE order_stats_id = ${incompleteOrdersResult[i].order_id};`;
            }
        
            con.query(incompleteItemsSql, function(err, incompleteItemsResult) {
                if (err) throw err;

                var ordersArray = [];

                for (i = 0; i < incompleteItemsResult.length; i++) {
                    if (incompleteItemsResult[i].length != 0) {
                        var type = Object.keys(incompleteItemsResult[i][0])[1].slice(0,-4);
                        var orderNumber = Object.values(incompleteItemsResult[i][0])[0];
                        var status = Object.values(incompleteItemsResult[i][0])[1];

                        if (ordersArray.filter(order => (order.orderNumber === orderNumber)).length > 0) {
                            var index = ordersArray.findIndex(i => i.orderNumber === orderNumber);
                            ordersArray[index][type] = status;
                        } else {
                            ordersArray.push({orderNumber: orderNumber, [type]: status});
                        }
                    }
                }

                res.end(JSON.stringify(ordersArray));
            });
        } else {
            res.end();
        }
    });
});

app.post('/pickUpOrder', function(req, res) {
    var sql = `UPDATE order_stats SET order_out = '${new Date().toISOString().slice(0, 19).replace('T', ' ')}' WHERE order_id = ${req.body.orderNumber}`;

    con.query(sql, function(err, result) {
        if (err) throw err;
    });

    res.end('')
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

//Get request is made
app.get('/orderMaxs', function(req, res) {
    let orderMaxs = {

    };
    //Starts queries connection to stark_db for total desserts
    con.query("SELECT MAX(ordered_dessert_id) FROM ordered_dessert", function (err, result, fields) {
        
        var resultArray1 = Object.values(JSON.parse(JSON.stringify(result)));
        orderMaxs['desserts'] = resultArray1[0]['MAX(ordered_dessert_id)'];

        //Starts queries connection to stark_db for total sides
        con.query("SELECT MAX(ordered_side_id) FROM ordered_side", function (err, result, fields) {
        
            var resultArray2 = Object.values(JSON.parse(JSON.stringify(result)));
            orderMaxs['sides'] = resultArray2[0]['MAX(ordered_side_id)'];
            
            //Starts queries connection to stark_db for total entrees
            con.query("SELECT MAX(ordered_entree_id) FROM ordered_entree", function (err, result, fields) {
        
                var resultArray3 = Object.values(JSON.parse(JSON.stringify(result)));
                orderMaxs['entrees'] = resultArray3[0]['MAX(ordered_entree_id)'];

                //Starts queries connection to stark_db for total drinks
                con.query("SELECT MAX(ordered_drink_id) FROM ordered_drink", function (err, result, fields) {
        
                    var resultArray4 = Object.values(JSON.parse(JSON.stringify(result)));
                    orderMaxs['drinks'] = resultArray4[0]['MAX(ordered_drink_id)'];

                    //Ends response with orderMaxs object containing results for nested arrays
                    res.end(JSON.stringify(orderMaxs))
                    
                 });
                
             });
         });
     });
});

// Register our search endpoint
app.get('/search', function(req, res) {
    console.log("DEBUG: Searching for " + req.body.query);
    // Replace SOME_TABLE with your own
    var sql = `
        (SELECT *, 'side' as type
        FROM side
        WHERE description LIKE ?)
        UNION
        (SELECT *, 'entree' as type
        FROM entree
        WHERE description LIKE ?)
        UNION
        (SELECT *, 'drink' as type
        FROM drink
        WHERE description LIKE ?)
        UNION
        (SELECT *, 'dessert' as type
        FROM dessert
        WHERE description LIKE ?);
    `;

    // Wraps search in % to perform a wildcard search
    var searchTerm = "%" + req.body.query + "%";
    con.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm], function(err, result) {

        res.end(JSON.stringify({
            status: err ? "error" : "success",
            data: result,
            error: err
        }));
    });
});

// Register the aggregation endpoint
app.get('/aggregate', function(req, res) {
    console.log("DEBUG: Aggregating " + req.body.type);
    if (req.body.type == "completionTime") {
        var sql = `
            SELECT
                AVG(TIMESTAMPDIFF(SECOND, order_in, order_out)) as average_time
            FROM
                stark_db.order_stats
            WHERE
                order_date BETWEEN ? AND ?;`;
        var startTime = (new Date(req.body.start)).toISOString();
        var endTime = (new Date(req.body.end)).toISOString();
        con.query(sql, [startTime, endTime], function(err, result) {
            if (err) throw err;

            // Default to 0 if result is null.
            res.end(JSON.stringify({average_time: result[0].average_time || 0}));
        });
    }else if (req.body.type == "completionOrderTime") {
        // First search for the item
        var table = req.body.table;
        // Filter out illegal table names
        if (!["dessert", "drink", "entree", "side"].includes(table)) {
            throw new Error("Invalid table");
        }
        var sql = `
            SELECT
                *
            FROM
                stark_db.${table}
            WHERE
                name LIKE ?;`
        var searchName = "%" + req.body.search + "%";
        con.query(sql, [searchName], function(err, result) {
            if (err) throw err;
            
            if (result.length > 0) {
                // Grab the id for this item
                var itemId = result[0][table + "_id"];
                var aggSql = `
                    SELECT
                        AVG(TIMESTAMPDIFF(SECOND, order_stats.order_in, order_stats.order_out)) as average_time
                    FROM
                        stark_db.order_stats
                    LEFT OUTER JOIN
                        stark_db.ordered_${table}
                        ON ordered_${table}.order_stats_id = order_stats.order_id
                    WHERE
                        order_stats.order_date BETWEEN ? AND ?
                        AND ordered_${table}.${table}_ordered = ${itemId};`;
                var startTime = (new Date(req.body.start)).toISOString();
                var endTime = (new Date(req.body.end)).toISOString();
                con.query(aggSql, [startTime, endTime], function(err, result) {
                    if (err) throw err;
                    console.log(result);

                    // Default to 0 if result is null.
                    res.end(JSON.stringify({average_time: result.length > 0 ? result[0].average_time : 0}));
                });

            }else{
                res.end(JSON.stringify({average_time: "No item found"}));
            }
        });
    }else{
        // Throw an error if the type is not handled
        if (!(req.body.type in typeColumns))
            throw new Error("Invalid aggregator type");
    }
});

// Listen for create requests
app.get('/create', function(req, res) {
    var itemData = JSON.parse(req.body.itemData);
    var table = itemData.table;
    // Filter out illegal table names
    if (!["dessert", "drink", "entree", "side"].includes(table)) {
        throw new Error("Invalid table");
    }
    var sql = `
        INSERT INTO ${table}
            (name, description, calories, ${table}_cost, qty_in_stock, reorder_level, active)
        VALUES
            (?, ?, ?, ?, ?, 1, 1);
    `;
    con.query(sql, [
        itemData.name,
        itemData.description,
        itemData.calories,
        itemData.cost,
        itemData.stock
    ], function(err, result) {
        if (err) throw err;
        res.end(JSON.stringify({message: "Success", result: result}));
    });
});

app.get('/deleteItem', function(req, res) {
    var table = req.body.table;
    // Filter out illegal table names
    if (!["dessert", "drink", "entree", "side"].includes(table)) {
        throw new Error("Invalid table");
    }
    var sql = `
        DELETE FROM ${table}
        WHERE ${table}_id = ?;
    `;
    con.query(sql, [
        req.body.id
    ], function(err, result) {
        if (err) throw err;
        res.end(JSON.stringify({message: "success", result: result}));
    });
});

app.get('/viewRows', function(req, res) {
    var sql = `
        SELECT
            *
        FROM
            stark_db.order_stats
        LEFT OUTER JOIN
            stark_db.order_items
            ON order_items.order_stats_id = order_stats.order_id
        WHERE
            order_stats.order_date BETWEEN ? AND ?;`;
    var startTime = (new Date("07-01-2019")).toISOString();
    var endTime = (new Date("07-30-2019")).toISOString();
    console.log(startTime, endTime);
    con.query(sql, [startTime, endTime], function(err, result) {
        if (err) throw err;

        // Default to 0 if result is null.
        res.end(JSON.stringify(result));
    });
});

//app.listen(3000, function(err) {
//    if (err) {
//        throw err;
//    }
//
//    console.log('Server started on port 3000.');
//});
