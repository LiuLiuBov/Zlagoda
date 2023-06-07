const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')

router.get('/products', auth, (req, res,) => {
    const getAllProducts = "SELECT p.id_product, p.category_number, c.category_name, p.product_name, p.caracteristics FROM product p JOIN category c ON p.category_number = c.category_number ORDER BY p.product_name";
    connection.query(getAllProducts, (err, result) => {
        if (err) throw err;
        //res.send(result)
        console.log(result);
        res.render('products', { 'products': result });
    })

})

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

router.get('/products/delete/:id_product', (req, res) => {
    const idProduct = req.params.id_product;
    console.log(idProduct);
    const sql = `DELETE FROM product WHERE id_product = ${idProduct}`;
    connection.query(sql, [idProduct], (err) => {
        if (err) throw err;
        console.log("1 record deleted");
        res.redirect('/products');
    });
});

router.get('/products/edit/:id_product', (req, res) => {
    const idProduct = req.params.id_product;
    const getAllCategories = "SELECT * FROM category";
    const getProduct = `SELECT * FROM product WHERE id_product = '${idProduct}'`;
    connection.query(getAllCategories, (err, categories) => {
        if (err) throw err;
        connection.query(getProduct, [idProduct], (err, result) => {
            if (err) throw err;
            //console.log(result);
            res.render('editproduct', { "product": result[0], 'categories': categories });
        })
    });
});

router.post('/products/edit/:cardnumber/editing', (req, res) => {
    const cardnumber = req.params.cardnumber;
    const {
        editclientfirstname,
        editclientlastname,
        editclientpatronymic,
        editclientphone,
        editclientcity,
        editclientstreet,
        editclientzipcode,
        editclientdiscount
    } = req.body;

    const updateQuery = `UPDATE customer_card SET
      cust_name = ?,
      cust_surname = ?,
      cust_patronymic = ?,
      phone_number = ?,
      city = ?,
      street = ?,
      zip_code = ?,
      percent = ?
      WHERE card_number = '${cardnumber}'`;

    const updateValues = [
        editclientfirstname,
        editclientlastname,
        editclientpatronymic,
        editclientphone,
        editclientcity,
        editclientstreet,
        editclientzipcode,
        editclientdiscount
    ];

    connection.query(updateQuery, updateValues, (err, result) => {
        if (err) throw err;
        console.log('Customer updated successfully');
        res.redirect('/customers');
    });
});

module.exports = router