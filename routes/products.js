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
            res.render('editproduct', { "product": result[0], "idproduct": idProduct, 'categories': categories });
        })
    });
});

router.post('/products/edit/:idproduct/editing', (req, res) => {
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

module.exports = router