const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');

router.get('/profile', auth, (req, res,) => {
    const user_id = res.locals.user_id;
    const getAllEmployees = `
    SELECT * FROM employee WHERE login = '${user_id}' 
    `;
    connection.query(getAllEmployees, (err, result) => {
        if(err) throw err;
        //res.send(result)
        console.log(result);
        res.render('profile', { 'profile': result });
    })
})

module.exports = router