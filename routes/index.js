const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const isAuthenticated = require('../middleware/auth')


router.get('/', auth, (req, res) => {
    res.render('index')
})


module.exports = router