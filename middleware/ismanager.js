const connection = require('../utils/database');
const notifier = require('node-notifier')
const path = require('path');

function checkManagerAccess(req, res, next) {

    const user_id = res.locals.user_id;
    const getEmployees = `
    SELECT * FROM employee WHERE login = '${user_id}' 
    `;
  
    connection.query(getEmployees, (err, result) => {
        if (result[0].empl_role == "manager"){
           next(); 
        } else {
        errorNotification('You do not have the rights to access this page');
    }
    })
};

function errorNotification(str) {

    notifier.notify({
      title: 'Error!',
      message: str,
      icon: path.join('./routes/images/error.png'),
      wait: true,
      sound: true,
      appID : 'ZLAGODA'
    })
  }
  
module.exports = checkManagerAccess;