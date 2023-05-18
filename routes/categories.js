const {Router} = require('express')
const router = Router()
const Category = require('../models/category')

router.get('/categories', (req, res,) => {
    res.render('categories')
})

router.post('/categories/add',async  (req, res,) => {
    const category = new Category(req.body.catnumber, req.body.catname)
    await category.save()
    res.redirect('/categories')

})

module.exports = router
