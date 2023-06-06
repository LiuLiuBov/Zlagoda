const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')

router.get('/categories', auth, (req, res,) => {
  const getAllCategories = "SELECT * FROM category";
  connection.query(getAllCategories, (err, result) => {
    if (err) throw err;
    //res.send(result)
    //console.log(result);
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

router.get('/categories/delete/:category_number', (req, res) => {
  const categoryNumber = req.params.category_number;
  console.log(categoryNumber);
  const sql = `DELETE FROM category WHERE category_number = ${categoryNumber}`;
  connection.query(sql, [categoryNumber], (err) => {
    if (err) throw err;
    console.log("1 record deleted");
    res.redirect('/categories');
  });
});

router.get('/categories/edit/:category_number', (req, res) => {
  const categoryNumber = req.params.category_number;
  const getCategory = `SELECT * FROM category WHERE category_number = ${categoryNumber}`;
  connection.query(getCategory,  [categoryNumber], (err, result) => {
    if (err) throw err;  
    //console.log(result);
    var categoryname = result[0].category_name
    //console.log(categoryname);
    res.render('editcategory', {"categoryNumber": categoryNumber, "categoryName": categoryname});
  })
});

router.post('/categories/edit/:categoryNumber/editing', (req, res) => {
  const categoryNumber = req.params.categoryNumber;
  const { editcategoryname } = req.body;

  console.log(categoryNumber)
  console.log(editcategoryname)

  const getCategory = `UPDATE category SET category_name = ? WHERE category_number = ?`;
  connection.query(getCategory, [editcategoryname, categoryNumber], (err, result) => {
    if (err) throw err;
    console.log('Category updated successfully');
    res.redirect('/categories');
  });
});

module.exports = router
