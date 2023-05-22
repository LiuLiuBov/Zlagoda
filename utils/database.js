var mysql = require('mysql');

var connection = mysql.createConnection({
  host: "DESKTOP-BTL29QK",
  user: "liubov",
  password: "12345678",
  database: "Zlagoda"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to the database!");
});

/*con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("CREATE DATABASE Zlagoda", function (err, result) {
      if (err) throw err;
      console.log("Database created");
    });
  });*/

  /*connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "INSERT INTO category (category_number,category_name) VALUES ('211', 'Vegetables')";
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
  });*/

  module.exports = connection