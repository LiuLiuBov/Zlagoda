const { Router } = require('express');
const router = Router();
const connection = require('../utils/database');
const bcrypt = require('bcryptjs')
var notifier = require('node-notifier')
const path = require('path');

router.get('/login', (req, res) => {
  res.render('auth/login', { layout: 'noLayout'/*, session: req.session*/ });
});

router.post('/login', (req, res) => {
  const user_id = req.body.login_login;
  const user_password = req.body.login_password;

  if (user_id && user_password) {
    const query = `
      SELECT * FROM employee
      WHERE login = "${user_id}"
    `;

    connection.query(query, (err, data) => {
      if (err) throw err;

      for (let i = 0; i < data.length; i++) {
        bcrypt.compare(user_password, data[i].password, (err, result) => {
          if (err) throw err;

          if (result) {
            req.session.user_id = data[i].login;
            req.session.isAuthenticated = true;
            return res.redirect('/');
          } else {
            errorNotification('Неправильний пароль');
          }
        });
      }
    });
  }
});


function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    res.locals.user_id = req.session.user_id;
    next();
  } else {
    res.redirect('/login');
  }
}

router.use((req, res, next) => {
  if (req.path !== '/login' && req.path !== '/logout') {
    isAuthenticated(req, res, next);
  } else {
    next();
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

function errorNotification(str) {

  notifier.notify({
    title: 'Помилка!',
    message: str,
    icon: path.join('./routes/images/error.png'),
    wait: true,
    sound: true,
    appID : 'ZLAGODA'
  })
}

module.exports = router;