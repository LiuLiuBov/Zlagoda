const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
const checkmanager = require('../middleware/ismanager')
var notifier = require('node-notifier')
const path = require('path');

router.get('/categories', auth, (req, res,) => {
  const getAllCategories = "SELECT * FROM category ORDER BY category_name";
  connection.query(getAllCategories, (err, result) => {
    if (err) throw err;
    //res.send(result)
    //console.log(result);
    res.render('categories', { 'categories': result });
  })

})

router.post('/categories/add', auth, checkmanager, async (req, res) => {
  const { catname } = req.body;

  const sql = "INSERT INTO category (category_name) VALUES (?)";
  connection.query(sql, [catname], (err, result) => {
    if (err) throw err;
    console.log("1 record inserted");
    res.redirect('/categories');
  });
});

router.get('/categories/error', auth, checkmanager, (req, res) => {
  const errorMessage = 'Помилка. Не можна видалити категорію, оскільки до неї належать товари. Спочатку видаліть товари!';
  res.render('error', { errorMessage });
});

router.get('/categories/delete/:category_number', auth, checkmanager, (req, res) => {
  const categoryNumber = req.params.category_number;

  const checkProducts = `SELECT * FROM product WHERE category_number = ${categoryNumber}`;
  connection.query(checkProducts, (err, result) => {
    if (err) throw err;
    
    if (result.length > 0) {
    // якщо є зв'язані товари, то вивести помилку
    //  res.redirect('/categories/error');
   errorNotification('Не можна видалити категорію, оскільки до неї належать товари. Спочатку видаліть товари!');
    } else {
      // якщо немає зв'язаних товарів, то видалити категорію
      const deleteCategory = `DELETE FROM category WHERE category_number = ${categoryNumber}`;
      connection.query(deleteCategory, (err) => {
        if (err) throw err;
        console.log("1 record deleted");
        res.redirect('/categories');
      });
    }
  });
});

router.get('/categories/edit/:category_number', auth, checkmanager, (req, res) => {
  const categoryNumber = req.params.category_number;
  const getCategory = `SELECT * FROM category WHERE category_number = ${categoryNumber}`;
  connection.query(getCategory,  [categoryNumber], (err, result) => {
    if (err) throw err;  
    var categoryname = result[0].category_name
    res.render('editcategory', {"categoryNumber": categoryNumber, "categoryName": categoryname});
  })
});

router.post('/categories/edit/:categoryNumber/editing', auth, checkmanager, (req, res) => {
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

function errorNotification(str) {

  notifier.notify({
    title: 'Помилка!',
    message: str,
    icon: path.join('./routes/images/error.png'),
    wait: true,
    sound: true,
    appID : 'ZLAGODA'
  })
}

module.exports = router
