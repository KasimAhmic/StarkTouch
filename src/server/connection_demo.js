var mysql = require('mysql');
var connection = mysql.createConnection({
    host                : '',   // IP address of database server
    user                : '',   // Database username
    password            : '',   // User password
    database            : '',   // Database name
    multipleStatements  : true  // Disable if you don't plan on running multiple statements in a single query
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;