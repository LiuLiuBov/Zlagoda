const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const { v4: uuidv4 } = require('uuid');
const checkmanager = require('../middleware/ismanager')
const checkcashier = require('../middleware/iscashier')
const path = require('path');
const pdf = require('html-pdf');
const fs = require('fs');

router.get('/customers', auth, checkcashier, (req, res,) => {
  const getAllCategories = "SELECT * FROM category ORDER BY category_name";
  const getAllCustomers = "SELECT * FROM customer_card ORDER BY cust_surname";
  connection.query(getAllCategories, (err, categories) => {
    connection.query(getAllCustomers, (err, result) => {
        if(err) throw err;
        //res.send(result)
        //console.log(result);
        res.render('customers', { 'customers': result, 
        "iscashier": res.locals.iscashier,
        "ismanager": res.locals.ismanager,
        "categories": categories
       });
    })
  })
})

router.post('/customers', auth, checkcashier, (req, res) => {
    const { searchpercent, searchbycategorybought } = req.body;
    console.log(searchbycategorybought);

    let getCustomers = "SELECT * FROM customer_card WHERE 1=1 ";

    if (searchpercent) {
      getCustomers += ` AND percent = '${searchpercent}'`;
    }
  
    if (searchbycategorybought && searchbycategorybought !== "none") {
      getCustomers += ` AND NOT EXISTS (
        SELECT *
        FROM product pr1
        WHERE pr1.category_number IN (
          SELECT category_number
          FROM category
          WHERE category_number = '${searchbycategorybought}'
        )
        AND pr1.id_product NOT IN (
          SELECT id_product
          FROM \`check\`
          INNER JOIN sale ON \`check\`.check_number = sale.check_number
          INNER JOIN store_product ON store_product.UPC = sale.UPC
          WHERE card_number = Customer_Card.card_number AND pr1.id_product IN (SELECT pr2.id_product 
          FROM Product pr2 
          WHERE pr2.category_number IN (
          SELECT category_number  
          FROM Category
          WHERE category_number = '${searchbycategorybought}') )
 
        )
      )`;
    }

    const getAllCategories = "SELECT * FROM category ORDER BY category_name";
    //let getCustomers = `SELECT * FROM customer_card WHERE percent = '${searchpercent}'`;

    connection.query(getAllCategories, (err, categories) => {
    connection.query(getCustomers, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('customers', { 'customers': result, 'iscashier': res.locals.iscashier,
        'ismanager': res.locals.ismanager, 
        'categories': categories
      });
    })
  })
});

router.get('/customers/add', auth, checkcashier, (req, res,) => {
    res.render('create-customer', {         
    'iscashier': res.locals.iscashier,
    'ismanager': res.locals.ismanager})
})

router.post('/customers/adding', auth, async (req, res) => {
    const {
        addclientfirstname,
        addclientlastname,
        addclientpatronymic,
        addclientphone,
        addclientcity,
        addclientstreet,
        addclientzipcode,
        addclientdiscount
    } = req.body;

    const addcustid = uuidv4().slice(0, 13);

    const query = "INSERT INTO customer_card (card_number, cust_name, cust_surname, cust_patronymic, phone_number, city, street, zip_code, percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    connection.query(
        query,
        [   addcustid,
            addclientfirstname,
            addclientlastname,
            addclientpatronymic,
            addclientphone,
            addclientcity,
            addclientstreet,
            addclientzipcode,
            addclientdiscount],
        (err) => {
            if (err) throw err;
            console.log("1 record inserted");
            res.redirect('/customers');
        });
});

router.get('/customers/delete/:card_number', auth, checkmanager, (req, res) => {
    const cardNumber = req.params.card_number;
    console.log(cardNumber);
    const sql = `DELETE FROM customer_card WHERE card_number = '${cardNumber}'`;
    connection.query(sql, [cardNumber], (err) => {
      if (err) throw err;
      console.log("1 record deleted");
      res.redirect('/customers');
    });
  });
  
  router.get('/customers/edit/:card_number', auth, (req, res) => {
    const cardNumber = req.params.card_number;
    const getCustomer = `SELECT * FROM customer_card WHERE card_number = '${cardNumber}'`;
    connection.query(getCustomer,  [cardNumber], (err, result) => {
      if (err) throw err;  
      //console.log(result);
      var custsurname = result[0].cust_surname
      var custname = result[0].cust_name
      var custpatronymic = result[0].cust_patronymic
      var phonenumber = result[0].phone_number
      var city = result[0].city
      var street = result[0].street
      var zipcode = result[0].zip_code
      var percent = result[0].percent
      res.render('editcustomer', 
      {
      "cardnumber": cardNumber, 
      "custsurname": custsurname,
      "custname": custname,
      "custpatronymic":custpatronymic,
      "phonenumber":phonenumber,
      "city": city,
      "street": street,
      "zipcode": zipcode,
      "percent": percent
    });
    })
  });
  
  router.post('/customers/edit/:cardnumber/editing', auth, (req, res) => {
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

  router.get('/customers/report', auth, (req, res) => {
    const getAllCategories = "SELECT * FROM customer_card ORDER BY cust_name";
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
            table-layout: fixed; 
          }
          
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
            word-wrap: break-word;
            width: min-content; 
            font-size: 12px;
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
            <h1>Звіт "Клієнти"</h1>
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
          <td>${category.cust_name}</td>
          <td>${category.cust_surname}</td>
          <td>${category.cust_patronymic}</td>
          <td>${category.phone_number}</td>
          <td>${category.city}</td>
          <td>${category.street}</td>
          <td>${category.zip_code}</td>
          <td>${category.percent}%</td>
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
              <th>Ім'я</th>
              <th>Прізвище</th>
              <th>По батькові</th>
              <th>Тел</th>
              <th>Місто</th>
              <th>Вулиця</th>
              <th>Індекс</th>
              <th>Відсоток знижки</th>
            </tr>
          `;
        currentPageHeight = 1050;
        pageNumber++;
      }
  
      currentPageHeight -= 40;
      tableHTML += categoryRow;
      if (i === categories.length - 1) {
  
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
            <tr class="header-row">
             <th>Ім'я</th>
              <th>Прізвище</th>
              <th>По батькові</th>
              <th>Тел</th>
              <th>Місто</th>
              <th>Вулиця</th>
              <th>Індекс</th>
              <th>Відсоток знижки</th>
          </tr>
          </thead>
          <tbody>
            ${tableHTML}
          </tbody>
        </table>
      `;
  }
  
  
module.exports = router