const { Router } = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
var notifier = require('node-notifier')
const path = require('path');
const checkcashier = require('../middleware/iscashier')

router.get('/productsinmarket', auth, checkcashier, (req, res) => {
    const sortCriteria = req.query.sortCriteria || 'product_name';

    let sortByClause = '';
    if (sortCriteria === 'products_number') {
        sortByClause = 'ORDER BY products_number ASC';
    } else {
        sortByClause = 'ORDER BY product_name ASC';
    }

    const getAllProducts = `
    SELECT sp.*, p.product_name, p.caracteristics, c.category_name
    FROM (store_product AS sp
    INNER JOIN product AS p ON sp.id_product = p.id_product)
    INNER JOIN category AS c ON p.category_number = c.category_number
    ${sortByClause}
    `;

    connection.query(getAllProducts, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('productsinmarket', {
            productsinmarket: result,
            iscashier: res.locals.iscashier,
            ismanager: res.locals.ismanager,
        });
    });
});


router.get('/productsinmarket/add', auth, (req, res,) => {
    const getAllProducts = "SELECT * FROM product";

    connection.query(getAllProducts, (err, products) => {
        if (err) throw err;
        console.log(products);
        res.render('create-productinmarket', { 'products': products });

    });
})

router.post('/productsinmarket/adding', auth, async (req, res) => {
    const {
        addUPC,
        addproduct,
        addproductinmarketsellingprice,
        addproductinmarketnumber,
        addpromotional
    } = req.body;

    const promotionalProduct = addpromotional ? 1 : 0;
    const queryCheckUPC = "SELECT UPC FROM store_product WHERE UPC = ?";
    const queryCheckIdProduct = "SELECT id_product FROM store_product WHERE id_product = ? AND promotional_product = ?";
    const queryInsert = "INSERT INTO store_product (UPC, id_product, selling_price, products_number, promotional_product) VALUES (?, ?, ?, ?, ?)";

    connection.query(
        queryCheckUPC,
        [addUPC],
        (err, upcResults) => {
            if (err) throw err;

            if (upcResults.length > 0) {
                errorNotification('Товар з таким UPC вже існує!');
            } else {
                connection.query(
                    queryCheckIdProduct,
                    [addproduct, promotionalProduct],
                    (err, idProductResults) => {
                        if (err) throw err;

                        if (idProductResults.length > 0) {
                            errorNotification('Інформація про даний товар вже існує в базі!');
                        } else {
                            connection.query(
                                queryInsert,
                                [addUPC, addproduct, addproductinmarketsellingprice, addproductinmarketnumber, promotionalProduct],
                                (err) => {
                                    if (err) throw err;
                                    console.log("1 record inserted");
                                    res.redirect('/productsinmarket');
                                }
                            );
                        }
                    }
                );
            }
        }
    );
});

router.get('/productsinmarket/delete/:UPC', auth, (req, res) => {
    const upc = req.params.UPC;
    console.log(upc);
    const sql = `DELETE FROM store_product WHERE UPC = ${upc}`;
    connection.query(sql, [upc], (err) => {
        if (err) throw err;
        console.log("1 record deleted");
        res.redirect('/productsinmarket');
    });
});

router.get('/productsinmarket/edit/:UPC', auth, (req, res) => {
    const upc_red = req.params.UPC;
    const getAllProducts = "SELECT * FROM product";
    const getProductInStore = `SELECT * FROM store_product WHERE UPC = '${upc_red}'`;
    connection.query(getAllProducts, (err, products) => {
        if (err) throw err;
        connection.query(getProductInStore, [upc_red], (err, result) => {
            if (err) throw err;
            //console.log(result[0].promotional_product);
            res.render('editproductinmarket', { "store_product": result[0], "upc": upc_red, 'products': products });
        })
    });
});

router.post('/productsinmarket/edit/:upc/editing', auth, (req, res) => {
    const upc_red = req.params.upc;
    const {
        editUPC,
        editproduct,
        editproductinmarketsellingprice,
        editproductinmarketnumber,
        editpromotional
    } = req.body;

    const promotionalProduct = editpromotional ? 1 : 0;
    console.log(promotionalProduct);

    const queryCheckUPC = "SELECT UPC FROM store_product WHERE UPC = ?";
    const queryCheckIdProduct = "SELECT id_product FROM store_product WHERE id_product = ? AND promotional_product = ?";
    const queryUpdate = `UPDATE store_product SET
      UPC = ?,
      id_product = ?,
      selling_price = ?,
      products_number = ?,
      promotional_product = ?
      WHERE UPC = ?`;

    if (editUPC === upc_red) {
        connection.query(
            queryUpdate,
            [editUPC, editproduct, editproductinmarketsellingprice, editproductinmarketnumber, promotionalProduct, upc_red],
            (err) => {
                if (err) throw err;
                console.log("1 record updated");
                res.redirect('/productsinmarket');
            }
        );
    } else {
        connection.query(
            queryCheckUPC,
            [editUPC],
            (err, upcResults) => {
                if (err) throw err;

                if (upcResults.length > 0 && upcResults[0].UPC !== upc_red) {
                    errorNotification("Товар з таким UPC вже існує!");
                } else {
                    connection.query(
                        queryCheckIdProduct,
                        [editproduct, promotionalProduct],
                        (err, idProductResults) => {
                            if (err) throw err;

                            if (idProductResults.length > 0) {
                                errorNotification('Інформація про даний товар вже міститься в базі!');
                            } else {
                                connection.query(
                                    queryUpdate,
                                    [editUPC, editproduct, editproductinmarketsellingprice, editproductinmarketnumber, promotionalProduct, upc_red],
                                    (err) => {
                                        if (err) throw err;
                                        console.log("1 record updated");
                                        res.redirect('/productsinmarket');
                                    }
                                );
                            }
                        }
                    );
                }
            }
        );
    }
});


function errorNotification(str) {

    notifier.notify({
        title: 'Помилка!',
        message: str,
        icon: path.join('./routes/images/error.png'),
        wait: true,
        sound: true,
        appID: 'ZLAGODA'
    })
}

module.exports = router