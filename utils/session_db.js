const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql');

let session_connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "liubov",
  password: "12345678",
  database: "session"
});

const sessionStore = new MySQLStore({
  expiration: 86400000,
  createDatabaseTable: true,
}, session_connection);


module.exports = sessionStore;