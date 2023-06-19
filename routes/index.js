const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const isAuthenticated = require('../middleware/auth')
const checkcashier = require('../middleware/iscashier')


router.get('/', auth, checkcashier, (req, res) => {
    console.log("2" + res.locals.iscashier)
    console.log("1" + res.locals.ismanager)
    res.render('index', {
        "iscashier": res.locals.iscashier,
        "ismanager": res.locals.ismanager
    })
})


module.exports = router