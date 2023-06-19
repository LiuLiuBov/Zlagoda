const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
var notifier = require('node-notifier')
const path = require('path');
const pdf = require('html-pdf'); // Добавьте зависимость для генерации PDF
const fs = require('fs'); // Добавьте зависимость для работы с файловой системой


router.get('/categories', auth, (req, res,) => {
  const getAllCategories = "SELECT * FROM category ORDER BY category_name";
  connection.query(getAllCategories, (err, result) => {
    if (err) throw err;
    //res.send(result)
    //console.log(result);
    res.render('categories', { 'categories': result });
  })

})

router.post('/categories/add', auth, async (req, res) => {
  const { catname } = req.body;

  const sql = "INSERT INTO category (category_name) VALUES (?)";
  connection.query(sql, [catname], (err, result) => {
    if (err) throw err;
    console.log("1 record inserted");
    res.redirect('/categories');
  });
});

router.get('/categories/error', (req, res) => {
  const errorMessage = 'Помилка. Не можна видалити категорію, оскільки до неї належать товари. Спочатку видаліть товари!';
  res.render('error', { errorMessage });
});

router.get('/categories/delete/:category_number', (req, res) => {
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

router.get('/categories/edit/:category_number', (req, res) => {
  const categoryNumber = req.params.category_number;
  const getCategory = `SELECT * FROM category WHERE category_number = ${categoryNumber}`;
  connection.query(getCategory,  [categoryNumber], (err, result) => {
    if (err) throw err;  
    var categoryname = result[0].category_name
    res.render('editcategory', {"categoryNumber": categoryNumber, "categoryName": categoryname});
  })
});

router.post('/categories/edit/:categoryNumber/editing', (req, res) => {
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
    let pageNumber = 1;
    const reportHTML = `
    <!DOCTYPE html>
<html>
<head>
    <title>Звіт по категоріям</title>
    <style>
        body {
            font-family: Times New Roman, sans-serif;
            margin: 0;
            padding: 0;
        }
        header {
            text-align: center;
            padding: 10px;
        }
        footer {
            text-align: center;
            padding: 10px;
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
    </style>
</head>
<body>
    <header>
        <p style="font-size: 10px; margin: 0; text-align: left;">${new Date().toLocaleString()}</p>
        <h1>Супермаркет "ZLAGODA"</h1>
    </header>
    <table>
        <thead>
            <tr>
                <th>Номер категорії</th>
                <th>Назва категорії</th>
            </tr>
        </thead>
        <tbody>
            ${categories
                .map(category => `
                    <tr>
                        <td>${category.category_number}</td>
                        <td>${category.category_name}</td>
                    </tr>
                `)
                .join('')}
        </tbody>
    </table>
    <footer>
    <p style="font-size: 10px; margin: 0; text-align: right;">${pageNumber}</p>
</footer>
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
      pageNumber++;
    });
  });
});


module.exports = router
