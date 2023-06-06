const { Router } = require('express');
const router = Router();
const connection = require('../utils/database');
const bcrypt = require('bcryptjs')

/*const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next(); // User is authenticated, proceed to the next middleware/route handler
  } else {
    res.redirect('/login'); // User is not authenticated, redirect to login page
  }
};*/

router.get('/login', (req, res) => {
  res.render('auth/login', { layout: 'noLayout'/*, session: req.session*/ });
});

router.post('/login', (req, res) => {
  const user_id = req.body.login_empl_id;
  const user_password = req.body.login_password;

  if (user_id && user_password) {
    const query = `
      SELECT * FROM employee
      WHERE id_employee = "${user_id}"
    `;

    connection.query(query, (err, data) => {
      if (err) throw err;

      for (let i = 0; i < data.length; i++) {
        if (bcrypt.compare(data[i].password, user_password)) {
          req.session.user_id = data[i].id_employee;
          req.session.isAuthenticated = true;
          return res.redirect('/');
        }
      }

      res.send('Incorrect password');
    });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Apply the isAuthenticated middleware to all routes except for '/login' and '/logout'
/*router.use((req, res, next) => {
  if (req.path !== '/login' && req.path !== '/logout') {
    isAuthenticated(req, res, next);
  } else {
    next();
  }
});*/

module.exports = router;