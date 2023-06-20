const { Router } = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
var notifier = require('node-notifier')
const path = require('path');
const checkcashier = require('../middleware/iscashier')
const checkmanager = require('../middleware/ismanager')
var notifier = require('node-notifier')
const pdf = require('html-pdf');
const fs = require('fs');

router.get('/productsinmarket', auth, checkcashier, (req, res) => {
    const sortCriteria = req.query.sortCriteria || 'product_name';
    const categoryNumber = req.query.categoryNumber || null;
    const priceRange = req.query.priceRange || null;

    let sortByClause = '';
    if (sortCriteria === 'products_number') {
        sortByClause = 'ORDER BY products_number ASC';
    } else {
        sortByClause = 'ORDER BY product_name ASC';
    }

    let filterClause = '';
    if (categoryNumber && priceRange) {
        filterClause = `WHERE p.category_number = ${categoryNumber} AND p.price >= ${priceRange}`;
    } else if (categoryNumber) {
        filterClause = `WHERE p.category_number = ${categoryNumber}`;
    } else if (priceRange) {
        filterClause = `WHERE p.price >= ${priceRange}`;
    }

    const getAllProducts = `
    SELECT sp.*, p.product_name, p.caracteristics, c.category_name
    FROM (store_product AS sp
    INNER JOIN product AS p ON sp.id_product = p.id_product)
    INNER JOIN category AS c ON p.category_number = c.category_number
    ${filterClause}
    ${sortByClause}
    `;

    connection.query(getAllProducts, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('productsinmarket', {
            'productsinmarket': result,
            'iscashier': res.locals.iscashier,
            'ismanager': res.locals.ismanager
        });
    });
});

router.get('/productsinmarket/get_data', auth, checkcashier, function (req, res, next) {

    var search_query = req.query.search_query;
    var query = `
    SELECT UPC FROM store_product
    WHERE UPC LIKE '%${search_query}%' 
    LIMIT 10
    `;

    connection.query(query, function (error, data) {
        res.json(data);

    });

});


router.post('/productsinmarket', auth, checkmanager, (req, res) => {
    const { searchupc } = req.body;
    console.log(searchupc);

    let getProducts = `
  SELECT sp.*, p.product_name, p.caracteristics, c.category_name
  FROM (store_product AS sp
  INNER JOIN product AS p ON sp.id_product = p.id_product)
  INNER JOIN category AS c ON p.category_number = c.category_number 
  WHERE 1=1 
  `;

    if (searchupc) {
        getProducts += ` AND sp.UPC = '${searchupc}'`;
    }

    connection.query(getProducts, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('productsinmarket', {
            'productsinmarket': result,
            'iscashier': res.locals.iscashier,
            'ismanager': res.locals.ismanager
        });
    });
});


router.get('/productsinmarket/add', auth, checkcashier,  (req, res,) => {
    const getAllProducts = "SELECT p.* FROM product AS p";
    const getAllProductsInStore = "SELECT * FROM store_product AS st INNER JOIN product AS p ON st.id_product = p.id_product ";

    connection.query(getAllProductsInStore, (err, productsinstore) => {
        connection.query(getAllProducts, (err, products) => {
            if (err) throw err;
            console.log(productsinstore);
            res.render('create-productinmarket', {
                'products': products,
                'iscashier': res.locals.iscashier,
                'ismanager': res.locals.ismanager,
                'productsinstore': productsinstore
            });
        });
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
    let queryInsert ;
    let a ;
    let addUPCPRO;
    let shouldNotAddProduct = false;


    if (promotionalProduct === 1) {
        if (addproduct) {
            const querySelectUPC = `SELECT UPC FROM store_product WHERE id_product ='${addproduct}'`;
            connection.query(querySelectUPC, [addproduct], (error, results) => {
                if (results.length < 1) {
                    errorNotification('Не можна визначити акційний товар!');
                    shouldNotAddProduct = true;
                    return;
                }
                const selectedUPC = results[0].UPC;
                addUPCPRO = selectedUPC;
                console.log(addUPCPRO);
    
                queryInsert = "INSERT INTO store_product (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product) VALUES (?, ?, ?, ?, ?, ?)";
                const values = [addUPC, addUPCPRO, addproduct, addproductinmarketsellingprice, addproductinmarketnumber, promotionalProduct];
                connection.query(queryInsert, values, (error, results) => {
                    res.redirect('/productsinmarket');
                });
            });
        }
    } else {
        queryInsert = "INSERT INTO store_product (UPC, id_product, selling_price, products_number, promotional_product) VALUES (?, ?, ?, ?, ?)";
        a = [addUPC, addproduct, addproductinmarketsellingprice, addproductinmarketnumber, promotionalProduct];
        connection.query(
            queryCheckUPC,
            [addUPC],
            (err, upcResults) => {
                if (err) throw err;
    
                if (upcResults.length > 0) {
                    errorNotification('Товар з таким UPC вже існує!');
                }
                else {
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
                                    a,
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
        
    }
    
    
});

router.get('/productsinmarket/delete/:UPC', auth, (req, res) => {
    const upc = req.params.UPC;
    const checkSales = `SELECT * FROM sale WHERE UPC = ${upc}`;

    connection.query(checkSales, (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            errorNotification('Не можна видалити товар, оскільки ынформацыя про нього мыститься у продажах');
        } else {
            const sql = `DELETE FROM store_product WHERE UPC = ${upc}`;
            connection.query(sql, (err) => {
                if (err) throw err;
                console.log("1 record deleted");
                res.redirect('/productsinmarket');
            });
        }
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