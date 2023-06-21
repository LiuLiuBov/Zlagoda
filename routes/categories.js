const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
const checkmanager = require('../middleware/ismanager')
var notifier = require('node-notifier')
const path = require('path');
const pdf = require('html-pdf');
const fs = require('fs');
const checkcashier = require('../middleware/iscashier')
var Handlebars = require('handlebars');
var helpers = require('handlebars-helpers')();

Handlebars.registerHelper('eq', helpers.eq);



router.get('/categories', auth, checkcashier, (req, res,) => {
  const getAllCategories = "SELECT * FROM category ORDER BY category_name";
  connection.query(getAllCategories, (err, result) => {
    if (err) throw err;
    //res.send(result)
    //console.log(result);
    var isCashier = res.locals.iscashier
    let isManager = res.locals.ismanager

    console.log(isManager);
    res.render('categories', { 'categories': result, 
    'isCashier': isCashier,
    'isManager': isManager });
  })

})

router.post('/categories', auth, checkmanager, checkcashier, (req, res) => {
  const { occupation} = req.body;

  let getCategories = `
  SELECT Category.category_number, Category.category_name
FROM  Category
WHERE NOT EXISTS (SELECT Product.id_product
                                         FROM Product
                                         WHERE Product.category_number = Category.category_number  AND 
                                                          NOT EXISTS  (SELECT Store_Product.id_product
                                                                                    FROM Store_Product
                                                                                    WHERE Product.id_product= Store_Product.id_product AND   
                                                                                                    Store_Product.promotional_product = 1 
                                                                                     )
                                           )

  
`;


  connection.query(getCategories, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.render('categories', {
          'categories': result,
          'iscashier': res.locals.iscashier,
          'ismanager': res.locals.ismanager
      });
  });
});

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
router.get('/categories/report', auth, (req, res) => {
  const getAllCategories = "SELECT * FROM category ORDER BY category_name";
  connection.query(getAllCategories, (err, result) => {
    if (err) throw err;

    const categories = result;
    const templatePath = path.join(__dirname, 'report-template.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

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
          
              <h1>Звіт "Категорії"</h1>
          </header>
          ${generateTable(categories)}
          
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

  });
});

function generateTable(categories) {
  let pageNumber = 1;
  let tableHTML = '';
  let currentPageHeight = 1050; 

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const categoryRow = `
    <tr>
      <td style="width: min-content;">${category.category_number}</td>
      <td>${category.category_name}</td>
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
          <th>Номер категорії</th>
          <th>Назва категорії</th>
        </tr>
      `;
      currentPageHeight = 1050; 
      pageNumber++; 
    }

    currentPageHeight -= 40;
    tableHTML += categoryRow;
    if (i === categories.length - 1 ) { 
      
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
          <th>Номер категорії</th>
          <th>Назва категорії</th>
        </tr>
      </thead>
      <tbody>
        ${tableHTML}
      </tbody>
    </table>
  `;
}



module.exports = router
