const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');
const checkcashier = require('../middleware/iscashier')
var notifier = require('node-notifier')
const path = require('path');

router.get('/profile', auth, checkcashier, (req, res,) => {
    const user_id = res.locals.user_id;
    const getAllEmployees = `
    SELECT * FROM employee WHERE login = '${user_id}' 
    `;
    connection.query(getAllEmployees, (err, result) => {
        if(err) throw err;
        //res.send(result)
        console.log(result);
        res.render('profile', { 'profile': result[0] });
    })
})

router.get('/profile/change-password', auth, checkcashier, (req, res) => {
    const user_id = res.locals.user_id;
    res.render('change-password');
  });
  
  router.post('/profile/change-password', auth, checkcashier, async (req, res) => {
    const user_id = res.locals.user_id;
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    if (user_id && currentPassword) {
      const query = `
        SELECT * FROM employee
        WHERE login = "${user_id}"
      `;
      connection.query(query, (err, data) => {
        if (err) throw err;
  
        if (data.length > 0) {
            bcrypt.compare(currentPassword, data[0].password, async function(err, result) {
                if (result === true) {
                const hashPassword = await bcrypt.hash(newPassword, 5)
                const query = `
                UPDATE employee
                SET
                password = ?
                WHERE login = ?
              `;
              connection.query(query, [hashPassword, user_id], function(err, results) {
                if (err) throw err;
                console.log("Пароль успіщно змінено!");
                res.redirect('/profile');

            });
                } else {
                    errorNotification('Неправильний пароль!');
                }
              });              
        } 
      });
    }
  });

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
  
module.exports = router