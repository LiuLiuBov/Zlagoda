const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')

router.get('/employees', auth, (req, res,) => {
    res.render('employees')
})

router.get('/employees/add', auth, (req, res,) => {
    res.render('create-employee')
})

module.exports = router