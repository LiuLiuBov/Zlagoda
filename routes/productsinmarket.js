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
/*router.post('/employees', auth, checkmanager, checkcashier, (req, res) => {
    const { searchsurname, occupation } = req.body;
    console.log(searchsurname);
    console.log(occupation);
  
    let getEmployees = "SELECT * FROM employee WHERE 1=1 ";
  
    if (searchsurname) {
      getEmployees += ` AND empl_surname = '${searchsurname}'`;
    }
  
    if (occupation && occupation !== "none") {
      getEmployees += ` AND empl_role = '${occupation}'`;
    }
  
    connection.query(getEmployees, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.render('employees', { 'employees': result, 'iscashier': res.locals.iscashier,
      'ismanager': res.locals.ismanager });
    });
  });*/

router.post('/productsinmarket', auth, checkmanager, checkcashier, (req, res) => {
    const { searchupc, sortsale, sortCriteria} = req.body;
    console.log(sortsale);

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

    if (sortsale && sortsale !== "none") {
        getProducts += ` AND sp.promotional_product = '${sortsale}'`;
      }
      if (sortCriteria && sortCriteria !== "none") {
        if(sortCriteria == "products_number"){
            getProducts += ` ORDER BY sp.${sortCriteria} DESC`;
        } else {
        getProducts += ` ORDER BY p.${sortCriteria} `;
        }
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


router.get('/productsinmarket/add', auth, checkmanager, checkcashier,  (req, res,) => {
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
    let price;
    let shouldNotAddProduct = false;


    if (promotionalProduct === 1) {
        if (addproduct) {
            const querySelectUPC = `SELECT UPC, selling_price FROM store_product WHERE id_product ='${addproduct}'`;
            connection.query(querySelectUPC, [addproduct], (error, results) => {
                if (results.length < 1) {
                    errorNotification('Не можна визначити акційний товар!');
                    shouldNotAddProduct = true;
                    return;
                }
                const selectedUPC = results[0].UPC;
                const selectedPRICE = results[0].selling_price * 0.8;
                addUPCPRO = selectedUPC;
                price = selectedPRICE;
                console.log(addUPCPRO);
    
                queryInsert = "INSERT INTO store_product (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product) VALUES (?, ?, ?, ?, ?, ?)";
                const values = [addUPC, addUPCPRO, addproduct, price, addproductinmarketnumber, promotionalProduct];
                connection.query(queryInsert, values, (error, results) => {
                    errorNotification('Акційну ціну було вирахувано за формулою!');
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

router.get('/productsinmarket/report', auth, (req, res) => {
    const getAllCategories = ` 
    SELECT sp.*, p.product_name, p.caracteristics, c.category_name
    FROM (store_product AS sp
    INNER JOIN product AS p ON sp.id_product = p.id_product)
    INNER JOIN category AS c ON p.category_number = c.category_number;
   
    `
    connection.query(getAllCategories, (err, result) => {
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
                
                    <h1>Звіт "Товари в магазині"</h1>
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
  
  
  function generateTable(products) {
    let pageNumber = 1;
    let tableHTML = '';
    let currentPageHeight = 1050; 
  
    for (let i = 0; i < products.length; i++) {
      const category = products[i];
      const promotionalProductText = category.promotional_product ? 'так' : 'ні';
      const categoryRow = `
      <tr>
        <td style="width: min-content;">${category.UPC}</td>
        <td>${category.category_name}</td>
        <td>${category.product_name}</td>
        <td>${category.selling_price}</td>
        <td>${category.products_number}</td>
        <td>${category.caracteristics}</td>
        <td>${promotionalProductText}</td>
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
          <th>UPC</th>
          <th>Назва категорії</th>
          <th>Назва товару</th>
          <th>Вартість</th>
          <th>Кількість</th>
          <th>Характеристики</th>
          <th>Акційний товар</th>
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
          <th>UPC</th>
          <th>Назва категорії</th>
          <th>Назва товару</th>
          <th>Вартість</th>
          <th>Кількість</th>
          <th>Характеристики</th>
          <th>Акційний товар</th>
          </tr>
        </thead>
        <tbody>
          ${tableHTML}
        </tbody>
      </table>
    `;
  }
  

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

router.get('/productsinmarket/summary', auth, checkcashier, function (req, res, next) {


    const getInfo = `
    SELECT c.category_number, SUM(sp.products_number) AS total_products
    FROM (store_product AS sp
    INNER JOIN product AS p ON sp.id_product = p.id_product)
    INNER JOIN category AS c ON p.category_number = c.category_number
    GROUP BY c.category_number
    `;

    connection.query(getInfo, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('summary', {
            'info': result,
            'iscashier': res.locals.iscashier,
            'ismanager': res.locals.ismanager
        });
    });


});

module.exports = router