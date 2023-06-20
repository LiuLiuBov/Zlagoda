const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
var notifier = require('node-notifier')
const path = require('path');
const checkcashier = require('../middleware/iscashier')

router.get('/products', auth, checkcashier, (req, res,) => {
    const getAllCategories = "SELECT * FROM category ORDER BY category_name";
    const getAllProducts = "SELECT p.id_product, p.category_number, c.category_name, p.product_name, p.caracteristics FROM product p JOIN category c ON p.category_number = c.category_number ORDER BY p.product_name";
    connection.query(getAllCategories, (err, categories) => {
    connection.query(getAllProducts, (err, result) => {
        if (err) throw err;
 
        res.render('products', { 'products': result, 
        'iscashier': res.locals.iscashier,
        'ismanager': res.locals.ismanager, 
        'categories': categories
      });
    })
    })
})

router.post('/products', auth, checkcashier,  (req, res) => {

    const getAllCategories = "SELECT * FROM category ORDER BY category_name";
    const { searchbycategory } = req.body;
    console.log(searchbycategory);

    let getProducts = "SELECT * FROM product WHERE 1=1 ";

    if (searchbycategory) {
        getProducts += ` AND category_number = '${searchbycategory}'`;
    }

    connection.query(getAllCategories, (err, categories) => {
    connection.query(getProducts, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('products', { 'products': result, 'categories': categories });
    })
})
});

router.get('/products/add', auth, (req, res,) => {
    const getAllCategories = "SELECT * FROM category";

    connection.query(getAllCategories, (err, categories) => {
        if (err) throw err;
        console.log(categories);
        res.render('create-product', { 'categories': categories });

    });
})

router.post('/products/adding', auth, async (req, res) => {
    const {
        addcategory,
        addproductname,
        addproductcharacteristics
    } = req.body;

    const query = "INSERT INTO product (category_number, product_name, caracteristics) VALUES (?, ?, ?)";

    connection.query(
        query,
        [addcategory,
            addproductname,
            addproductcharacteristics],
        (err) => {
            if (err) throw err;
            console.log("1 record inserted");
            res.redirect('/products');
        });
});

router.get('/products/delete/:id_product', auth, (req, res) => {
    const idProduct = req.params.id_product;
    console.log(idProduct);

    const checkProductsInStore = `SELECT * FROM store_product WHERE id_product = ${idProduct}`;

    connection.query(checkProductsInStore, (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            console.log("hello");
        // якщо є зв'язані товари в магазині, то вивести помилку
       errorNotification('Перед тим як видалити товар, необхідно спочатку видалити відповідний товар у розділі "Товари в магазині".');
        } else {
          // якщо немає зв'язаних товарів в магазині, то видалити товар
          const deleteProduct = `DELETE FROM product WHERE id_product = ${idProduct}`;
          connection.query(deleteProduct, (err) => {
            if (err) throw err;
            console.log("1 record deleted");
            res.redirect('/products');
          });
        }
      });
});

router.get('/products/edit/:id_product', auth, (req, res) => {
    const idProduct = req.params.id_product;
    const getAllCategories = "SELECT * FROM category";
    const getProduct = `SELECT * FROM product WHERE id_product = '${idProduct}'`;
    connection.query(getAllCategories, (err, categories) => {
        if (err) throw err;
        connection.query(getProduct, [idProduct], (err, result) => {
            if (err) throw err;
            //console.log(result);
            res.render('editproduct', { "product": result[0], "idproduct": idProduct, 'categories': categories });
        })
    });
});

router.post('/products/edit/:idproduct/editing', auth,  (req, res) => {
    const idProduct = req.params.idproduct;
    const {
        editcategory,
        editproductname,
        editproductcharacteristics
    } = req.body;

    const updateQuery = `UPDATE product SET
      category_number = ?,
      product_name = ?,
      caracteristics = ?
      WHERE id_product = ${idProduct}`;

    const updateValues = [
        editcategory,
        editproductname,
        editproductcharacteristics
    ];

    connection.query(updateQuery, updateValues, (err, result) => {
        if (err) throw err;
        console.log('Product updated successfully');
        res.redirect('/products');
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