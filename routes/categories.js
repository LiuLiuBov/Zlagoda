const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
const checkmanager = require('../middleware/ismanager')
let notifier = require('node-notifier')
const path = require('path');
const pdf = require('html-pdf');
const fs = require('fs');
const checkrole = require('../middleware/check-role')
let Handlebars = require('handlebars');
let helpers = require('handlebars-helpers')();

Handlebars.registerHelper('eq', helpers.eq);



router.get('/categories', auth, checkrole, checkmanager, (req, res,) => {
  const getAllCategories = "SELECT * FROM category ORDER BY category_name";
  connection.query(getAllCategories, (err, result) => {
    if (err) throw err;
    let isCashier = res.locals.iscashier
    let isManager = res.locals.ismanager

    console.log(isManager);
    res.render('categories', { 'categories': result, 
    'isCashier': isCashier,
    'isManager': isManager });
  })

})

router.post('/categories/add', auth, checkmanager, checkrole, async (req, res) => {
  const { catname } = req.body;

  const sql = "INSERT INTO category (category_name) VALUES (?)";
  connection.query(sql, [catname], (err, result) => {
    if (err) throw err;
    console.log("1 record inserted");
    res.redirect('/categories');
  });
});

router.get('/categories/error', auth, checkmanager, (req, res) => {
  const errorMessage = 'Error. Can not delete category with existing products. Firstly delete the products!';
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
   errorNotification('Error. Can not delete category with existing products. Firstly delete the products!');
   return res.redirect('/categories');
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



router.get('/categories/edit/:category_number', auth, checkrole, checkmanager, (req, res) => {
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
    title: 'Error!',
    message: str,
    icon: path.join('./images/error.png'),
    wait: true,
    sound: true,
    appID : 'ZLAGODA'
  })
}
router.get('/categories/report', auth, checkmanager, (req, res) => {
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
          <span style="font-size: 10px; margin: 0; text-align: right; margin-top: 10px; margin-right: 1px;">Supermarket "ZLAGODA"</span>
          
              <h1>Categories report</h1>
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
        <span style="font-size: 10px; margin: 0; text-align: right; margin-top: 10px; margin-right: 1px;">Supermarket "ZLAGODA"</span>
        <p style="margin-top: 90px; margin-bottom: 30px;"></p>
        <tr class="header-row">
          <th>Category number</th>
          <th>Category name</th>
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
          <th>Category number</th>
          <th>Category name</th>
        </tr>
      </thead>
      <tbody>
        ${tableHTML}
      </tbody>
    </table>
  `;
}



module.exports = router
