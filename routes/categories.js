const {Router} = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')

router.get('/categories', auth, (req, res,) => {
    const getAllCategories = "SELECT * FROM category";
    connection.query(getAllCategories, (err, result) => {
        if(err) throw err;
        //res.send(result)
        console.log(result);
        res.render('categories', { 'categories': result });
    })
    
})

router.post('/categories/add', auth, async (req, res) => {
    const { catname } = req.body;
  
    const sql = "INSERT INTO category (category_name) VALUES (?)";
    connection.query(sql, [catname], (err, result) => {
      if (err) throw err;
      console.log("1 record inserted");
      res.redirect('/categories');
    });
  });

module.exports = router
