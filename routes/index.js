const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const isAuthenticated = require('../middleware/auth')
const checkcashier = require('../middleware/iscashier')


router.get('/', auth, checkcashier, (req, res) => {
    //console.log(res.locals.iscashier)
    res.render('index', {
        "iscashier": res.locals.iscashier
    })
})


module.exports = router