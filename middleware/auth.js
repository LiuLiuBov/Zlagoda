module.exports = function(req, res, next){
    if(!req.session.isAuthenticated){
        return res.redirect('/login')
    }
    next()
}

const connection = require('../utils/database');

function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    const user_id = req.session.user_id;
    
    const query = `
      SELECT empl_name, empl_surname FROM employee
      WHERE id_employee = ${user_id}
    `;

    connection.query(query, (err, data) => {
      if (err) throw err;
      
      if (data.length > 0) {
        const { empl_name, empl_surname } = data[0];
        res.locals.user_id = user_id;
        res.locals.user_name = `${empl_name} ${empl_surname}`;
      }
      next();
    });
  } else {
    res.redirect('/login');
  }
}
  
  module.exports = isAuthenticated;
  