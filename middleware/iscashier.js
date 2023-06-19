const connection = require('../utils/database');

function checkCashierAccess(req, res, next) {

    const user_id = res.locals.user_id;
    const getEmployees = `
    SELECT * FROM employee WHERE login = '${user_id}' 
    `;
  
    connection.query(getEmployees, (err, result) => {
        if (result[0].empl_role == "cashier"){
            res.locals.iscashier = true;
            res.locals.ismanager = false;
           next();
        } else {
            res.locals.ismanager = true;
            res.locals.iscashier= false;
           next();
    }
    })
};

  
module.exports = checkCashierAccess;