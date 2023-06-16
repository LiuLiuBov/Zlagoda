const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')

router.get('/productsinmarket', auth, (req, res) => {
  const sortCriteria = req.query.sortCriteria || 'product_name'; 

  const getAllProducts = `
  SELECT sp.*, p.product_name, p.caracteristics, c.category_name
  FROM (store_product AS sp
  INNER JOIN product AS p ON sp.id_product = p.id_product)
  INNER JOIN category AS c ON p.category_number = c.category_number
 
  `;
//   ORDER BY ${sortCriteria}
  connection.query(getAllProducts, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.render('productsinmarket', { 'productsinmarket': result });
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
    console.log(addpromotional)

    const promotionalProduct = addpromotional ? 1 : 0;
    const query = "INSERT INTO store_product (UPC, id_product, selling_price, products_number, promotional_product) VALUES (?, ?, ?, ?, ?)";

    connection.query(
        query,
        [addUPC,
          addproduct,
          addproductinmarketsellingprice,
          addproductinmarketnumber,
          promotionalProduct],
        (err) => {
            if (err) throw err;
            console.log("1 record inserted");
            res.redirect('/productsinmarket');
        });
  });

  router.get('/productsinmarket/delete/:UPC', (req, res) => {
    const upc = req.params.UPC;
    console.log(upc);
    const sql = `DELETE FROM store_product WHERE UPC = ${upc}`;
    connection.query(sql, [upc], (err) => {
        if (err) throw err;
        console.log("1 record deleted");
        res.redirect('/productsinmarket');
    });
});

router.get('/productsinmarket/edit/:UPC', (req, res) => {
  const upc_red = req.params.UPC;
  const getAllProducts = "SELECT * FROM product";
  const getProductInStore = `SELECT * FROM store_product WHERE UPC = '${upc_red}'`;
  connection.query(getAllProducts, (err, products) => {
      if (err) throw err;
      connection.query(getProductInStore, [upc_red], (err, result) => {
          if (err) throw err;
          //console.log(result[0].promotional_product);
          res.render('editproductinmarket', { "store_product": result[0], "upc": upc_red, 'products': products});
      })
  });
});

router.post('/productsinmarket/edit/:upc/editing', (req, res) => {
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

  const updateQuery = `UPDATE store_product SET
    UPC = ?,
    id_product = ?,
    selling_price = ?,
    products_number = ?,
    promotional_product = ?
    WHERE UPC = ${upc_red}`;

  const updateValues = [
    editUPC,
    editproduct,
    editproductinmarketsellingprice,
    editproductinmarketnumber,
    promotionalProduct
  ];

  connection.query(updateQuery, updateValues, (err, result) => {
      if (err) throw err;
      console.log('Product updated successfully');
      res.redirect('/productsinmarket');
  });
});

module.exports = router