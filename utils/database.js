const mysql = require('mysql');

var connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "liubov",
  password: "12345678",
  database: "Zlagoda"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to the database!");
});

module.exports = connection;