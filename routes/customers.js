const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')

router.get('/customers', auth, (req, res,) => {
    res.render('customers')
})

router.get('/customers/add', auth, (req, res,) => {
    res.render('create-customer')
})

module.exports = router