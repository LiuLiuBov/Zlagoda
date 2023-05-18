const {Router} = require('express')
const router = Router()

router.get('/employees', (req, res,) => {
    res.render('employees')
})

router.get('/employees/add', (req, res,) => {
    res.render('create-employee')
})

module.exports = router