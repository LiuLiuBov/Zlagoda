const {Router} = require('express')
const router = Router()

router.get('/customers', (req, res,) => {
    res.render('customers')
})

router.get('/customers/add', (req, res,) => {
    res.render('create-customer')
})

module.exports = router