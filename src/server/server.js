const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const con = require('./connection.js');

var database = 60;
var config = require('./config.json')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/submitOrder', function(req, res) {
    var order = {
        "name": req.body.name,
        "cart": JSON.parse(req.body.cart),
        "total": req.body.total,
        "dineIn": req.body.dineIn
    };
    var sql = `SET autocommit = 0;
        START TRANSACTION;
           INSERT INTO order_stats (restaurant_id, order_date, dine_in) VALUES ('${config.restaurant.id}', curdate(), '${order.dineIn ? 1 : 0}');
           SELECT @orderstats_id := MAX(order_id)
           FROM order_stats;
           INSERT INTO ordered_entree (order_stats_id, entree_ordered) VALUES (@orderstats_id, '6');
        COMMIT;
        SET autocommit = 1;`;

    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log("Order submitted.");
    }).on('end', function() {
        generateOrderNumber(function(number) {
            res.end(`Thank you ${order.name}! Your order number is ${number} and will be ready shortly!`);
        });
    });
});

app.post('/getMenu', function(req, res) {
    var sql = `SELECT JSON_OBJECT(
        "ID", entree_id,
        "Name", description,
        "Cost", entree_cost,
        "Active", active)
    FROM entree;`;

    var minSQL = `SELECT JSON_OBJECT("Entrees",(SELECT CAST(CONCAT("[",GROUP_CONCAT(JSON_OBJECT("ID",entree_id,"Name",description,"Cost",entree_cost,"Active",active)),"]")AS JSON)FROM entree),"Sides",(SELECT CAST(CONCAT("[",GROUP_CONCAT(JSON_OBJECT("ID",side_id,"Name",description,"Cost",side_cost,"Active",active)),"]")AS JSON)FROM side),"Desserts",(SELECT CAST(CONCAT("[",GROUP_CONCAT(JSON_OBJECT("ID",dessert_id,"Name",description,"Cost",dessert_cost,"Active",active)),"]")AS JSON)FROM dessert),"Drinks",(SELECT CAST(CONCAT("[",GROUP_CONCAT(JSON_OBJECT("ID",drink_id,"Name",description,"Cost",drink_cost,"Active",active)),"]")AS JSON)FROM drink));`;
    var newSQL = `SELECT JSON_OBJECT (
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
                                "active", active
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
                                "active", active
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
                                "active", active
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
                                "active", active
                            )
                        ),
                    "]") AS JSON
                ) FROM drink
            )
        )
    );`;

    con.query(newSQL, function(err, result) {
        if (err) throw err;
        var parsedJSON = {};

        for(i = 0; i < result.length; i++) {
            console.log((Object.values(result[i])[0]))
            parsedJSON = ((Object.values(result[i])[0]));
        }

        res.end(JSON.stringify(parsedJSON));
    });
});

app.listen(3000, function(err) {
    if (err) {
        throw err;
    }

    console.log('Server started on port 3000.');
});

function generateOrderNumber(callback) {
    /*
     * This function needs to query the size of a table that stores order information. It simply needs to get the number of entires and 
     * modulo it by 999 to get the current order number. The 999 comes from a rotating limit of 1000 orders per day. The database will store
     * orders using an auto incrementing primary key and the order number stored in the database will be used almost exclussively for the
     * customer knowing which order is theirs.
     * 
     * Example:
     * If table size is 576, 576 % 999 = 576 so the order number is 576
     * If table size is 8945, 8945 % 999 = 953 so the order number is 953
     */
    //if ((database + 1) > 999) {
    //    database = 1;
    //    return String(database);
    //}
    //database++;
    //return String(database);

    var sql = `SELECT MAX(order_id) FROM order_stats`;
    con.query(sql, function(err, result) {
        if (err) throw err;
        Object.keys(result).forEach(function(key) {
            var row = result[key];
            console.log(Object.values(row)[0]);
            callback(Object.values(row)[0] % 999);
        });
    });
}