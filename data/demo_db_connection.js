var mysql = require('mysql');

var con = mysql.createConnection({
  host: "DESKTOP-BTL29QK",
  user: "liubov",
  password: "12345678"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});