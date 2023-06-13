const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');

router.get('/productsinmarket', auth, (req, res) => {
    const getAllProducts = "SELECT * FROM store_product";
    
    connection.query(getAllProducts, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.render('productsinmarket', { 'productsinmarket': result });
    });
  });


module.exports = router