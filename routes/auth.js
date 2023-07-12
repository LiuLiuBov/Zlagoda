const { Router } = require('express');
const router = Router();
const connection = require('../utils/database');
const bcrypt = require('bcryptjs')
const notifier = require('node-notifier')
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

      if (data.length === 0) {
        errorNotification('Wrong login');
        return res.redirect('/login');
      }

      for (const element of data) {
        bcrypt.compare(user_password, element.password, (err, result) => {
          if (err) throw err;

          if (result) {
            req.session.user_id = element.login;
            req.session.isAuthenticated = true;
            return res.redirect('/');
          } else {
            errorNotification('Wrong password');
            return res.redirect('/login');
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


function errorNotification(str) {

  notifier.notify({
    title: 'Error!',
    message: str,
    icon: path.join('./images/error.png'),
    wait: true,
    sound: true,
    appID : 'ZLAGODA'
  })
}

module.exports = router;