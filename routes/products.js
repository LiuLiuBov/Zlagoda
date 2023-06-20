const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
var notifier = require('node-notifier')
const path = require('path');
const checkcashier = require('../middleware/iscashier')
const fs = require('fs');
const pdf = require('html-pdf');
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
    const {searchproduct, searchbycategory } = req.body;

    let getProducts = "SELECT * FROM product as p INNER JOIN category c ON p.category_number = c.category_number WHERE 1=1 ";

    if (searchproduct) {
        getProducts += ` AND p.product_name = '${searchproduct}'`;
    }

    if (searchbycategory && searchbycategory !== "none") {
        getProducts += ` AND p.category_number = '${searchbycategory}'`;
    }

    connection.query(getAllCategories, (err, categories) => {
    connection.query(getProducts, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('products', { 'products': result, 'categories': categories });
    })
})
});

router.get('/get_data', auth, function(req, res, next){

  var search_query = req.query.search_query;
  var query = `
  SELECT product_name FROM product
  WHERE product_name LIKE '%${search_query}%' 
  LIMIT 10
  `;

  connection.query(query, function(error, data){
      res.json(data);

  });

});

router.post('/suggestions', auth, checkcashier, (req, res) => {
    const input = req.body.input;
    const query = `SELECT * FROM product WHERE product_name LIKE '${input}%'`;

    connection.query(query, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(result);
        }
    });
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

  router.get('/products/report', auth, (req, res) => {
    const getAllCategories = "SELECT * FROM category ORDER BY category_name";
    const getAllProducts = "SELECT p.id_product, p.category_number, c.category_name, p.product_name, p.caracteristics FROM product p JOIN category c ON p.category_number = c.category_number ORDER BY p.product_name";
    connection.query(getAllCategories, (err, reult) => {
        connection.query(getAllProducts, (err, result) => {
            if (err) throw err;
            const products = result;
            const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                body {
                  font-family: Times New Roman, sans-serif;
                  margin: 0;
                  padding: 0;
                }
                h1 {
                  text-align: center;
              }
              
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                
                th, td {
                  border: 1px solid black;
                  padding: 8px;
                  text-align: left;
                }
                
                .header-row {
                  font-weight: bold;
                }
                
                .page-break {
                  page-break-after: always;
                  text-align: center;
                  padding-top: 50px;
      
                }
                
                </style>
            </head>
            <body>
                <header>
                <span style="font-size: 10px; margin: 0; text-align: right; margin-top: 10px;margin-left: 10px; margin-right: 595px;">${new Date().toLocaleString()}</span>
                <span style="font-size: 10px; margin: 0; text-align: right; margin-top: 10px; margin-right: 1px;">Магазин "ZLAGODA"</span>
                
                    <h1>Звіт "Товари"</h1>
                </header>
                ${generateTable(products)}
                
            </body>
            </html>
          `;
          const options = { format: 'Letter' }; 
          const tempHTMLPath = path.join(__dirname, 'temp-report.html');
          fs.writeFileSync(tempHTMLPath, reportHTML, 'utf-8');
      
          pdf.create(fs.readFileSync(tempHTMLPath, 'utf-8'), options).toBuffer((err, buffer) => {
            if (err) throw err;
      
            fs.unlinkSync(tempHTMLPath);
      
            res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline; filename=report.pdf'
            });
            res.send(buffer);
          });
        })
        })
    })
  
  
  function generateTable(products) {
    let pageNumber = 1;
    let tableHTML = '';
    let currentPageHeight = 1050; 
  
    for (let i = 0; i < products.length; i++) {
      const category = products[i];
      const categoryRow = `
      <tr>
        <td style="width: min-content;">${category.id_product}</td>
        <td>${category.category_name}</td>
        <td>${category.product_name}</td>
        <td>${category.caracteristics}</td>
      </tr>
      `;
  
      if (currentPageHeight <= 200) { 
        tableHTML += `
          </tbody></table><div class="page-break">
          <p style="font-size: 12px; margin: 0; text-align: center; margin-bottom: 15px;">${pageNumber}</p>
          </div><table>
          <tbody>   
        `;
        tableHTML += `
          <span style="font-size: 10px; margin: 0; text-align: right; margin-top: 10px;margin-left: 10px; margin-right: 595px;">${new Date().toLocaleString()}</span>
          <span style="font-size: 10px; margin: 0; text-align: right; margin-top: 10px; margin-right: 1px;">Магазин "ZLAGODA"</span>
          <p style="margin-top: 90px; margin-bottom: 30px;"></p>
          <tr class="header-row">
            <th>Номер товару</th>
            <th>Назва категорії</th>
            <th>Назва товару</th>
            <th>Характеристики</th>
          </tr>
        `;
        currentPageHeight = 1050; 
        pageNumber++; 
      }
  
      currentPageHeight -= 40;
      tableHTML += categoryRow;
      if (i === products.length - 1 ) { 
        
        let lastPageNumber = pageNumber;
        tableHTML += `
          </tbody></table><div class="page-break">
          
        `;
  
        while (currentPageHeight > 199) {
          tableHTML += '<p style= "color: #fff;">a</p>';
          currentPageHeight -= 41;
        }
        tableHTML += `
        <p style="font-size: 12px; margin: 0; text-align: center; margin-bottom: 5px;">${lastPageNumber}</p>
        </div>
      `;
      }
    }
  
    return `
      <table>
        <thead>
          <tr>
          <th>Номер товару</th>
          <th>Назва категорії</th>
          <th>Назва товару</th>
          <th>Характеристики</th>
          </tr>
        </thead>
        <tbody>
          ${tableHTML}
        </tbody>
      </table>
    `;
  }
  
module.exports = router