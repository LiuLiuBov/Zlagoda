const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
var notifier = require('node-notifier')
const path = require('path')
const pdf = require('html-pdf');
const fs = require('fs');
const checkcashier = require('../middleware/iscashier')

router.get('/checks', auth, checkcashier, (req, res) => {
  const getAllEmpl = "SELECT * FROM employee ORDER BY empl_surname";
  const getAllProd = "SELECT * FROM store_product AS st INNER JOIN product AS p WHERE st.id_product = p.id_product";
  const deleteZeroTotalChecks = "DELETE FROM `check` WHERE sum_total = 0";
  const getAllChecks = "SELECT ch.*, e.empl_surname FROM (`check` AS ch INNER JOIN employee AS e ON ch.id_employee = e.id_employee) INNER JOIN customer_card AS cust ON ch.card_number = cust.card_number";
  const user_empl_id = res.locals.user_empl_id;
  const user_name = res.locals.user_name;
  const user_id = res.locals.user_id;
  console.log(user_id);

  connection.query(getAllProd, (err, products) => {
  connection.query(getAllEmpl, (err, employees) => {
  connection.query(deleteZeroTotalChecks, (err) => {
    if (err) throw err;

    connection.query(getAllChecks, (err, result) => {
      if (err) throw err;

      console.log(products);
      res.render('checks', { 'checks': result, 'iscashier': res.locals.iscashier,
      'employees':employees,
      'products':products,
      'ismanager': res.locals.ismanager });
    });
  });
  })
})
})


router.post('/checks', auth, checkcashier, (req, res) => {
  const getAllEmpl = "SELECT * FROM employee ORDER BY empl_surname";
  const getAllProd = "SELECT * FROM store_product AS st INNER JOIN product AS p WHERE st.id_product = p.id_product";
  
  const { searchnumber, searchbycategory, startDate, endDate, today, searchbyprod } = req.body;
  
  let getChecks = "SELECT ch.*, e.empl_surname FROM `check` AS ch INNER JOIN employee AS e ON ch.id_employee = e.id_employee WHERE 1=1";


  if (searchnumber) {
    getChecks += ` AND ch.check_number = '${searchnumber}'`;
  }
  if (searchbycategory && searchbycategory !== "none") {
    getChecks += ` AND e.id_employee = '${ searchbycategory}'`;
  }

  if (startDate && startDate !== "none") {
    getChecks += ` AND ch.print_date BETWEEN '${ startDate}' AND' ${ endDate}'`;
  }
  var current_datetime = new Date();
  if (today) {
    getChecks += ` AND ch.print_date = '${current_datetime}`;
  }

  let getSalesQuery = "SELECT SUM(s.product_number) FROM (sale AS s INNER JOIN `check` AS c ON s.check_number = c.check_number) INNER JOIN store_product AS st ON s.UPC = st.UPC INNER JOIN product AS p ON st.id_product = p.id_product WHERE 1=1";

  if (searchbyprod) {
    getSalesQuery += ` AND p.id_product= '${searchbyprod}'`;
    }
    if (startDate && startDate !== "none") {
      getSalesQuery += ` AND c.print_date BETWEEN '${ startDate}' AND' ${ endDate}'`;
    }
const getCheck = `${getChecks}`;
const getSales = `${getSalesQuery}`;
connection.query(getAllProd, (err, products) => {
  connection.query(getAllEmpl, (err, employees) => {
  connection.query(getCheck, (err, checkResults) => {
    if (err) throw err;
    connection.query(getSales, (err, salesResults) => {
      if (err) throw err;
      console.log(salesResults);
  
      res.render('checks', { 
        'checks': checkResults,
        'sales': salesResults,
        'employees': employees,
        'products':products,
        'iscashier': res.locals.iscashier,
        'ismanager': res.locals.ismanager,
        'salesResults': salesResults[0]['SUM(s.product_number)']
      });
    });
    });
  });
});
});

router.get('/checks/get_data', auth, function(req, res, next){
  var search_query = req.query.search_query;
  var query = `SELECT check_number FROM \`check\` WHERE check_number LIKE '%${search_query}%'  LIMIT 10`;
  

  connection.query(query, function(error, data){
      res.json(data);

  });

});

router.get('/checks/add', auth, checkcashier, (req, res) => {
  const user_name = res.locals.user_name;
  const user_id = res.locals.user_id;
  const user_empl_id = res.locals.user_empl_id;
  const getAllCust = "SELECT * FROM customer_card";
  const getAllProducts = "SELECT * FROM store_product AS st INNER JOIN product AS p ON st.id_product = p.id_product";
  const insertQuery = "INSERT INTO `check` (check_number, id_employee, print_date, sum_total, vat) VALUES (?, ?, ?, 0, 0)";

  generateCheckNumber((checkNumber) => {
    const current_datetime = new Date();
    const values = [checkNumber, user_empl_id, current_datetime];
    connection.query(insertQuery, values, (err, result) => {
      if (err) throw err;
      connection.query(getAllCust, (err, cards) => {
      connection.query(getAllProducts, (err, products) => {
        if (err) throw err;

        res.render('create-check', { user_name, user_id, user_empl_id, checkNumber, products,    
          'cards':cards,     
          'iscashier': res.locals.iscashier,
        'ismanager': res.locals.ismanager  });
      });
      });
    });
  });
});


function generateCheckNumber(callback) {
  let checkNumber = Math.floor(Math.random() * 1000000) + 1;

  const checkQuery = "SELECT * FROM `check` WHERE check_number = ?";
  connection.query(checkQuery, checkNumber, (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      generateCheckNumber(callback);
    } else {
      callback(checkNumber);
    }
  });
}

router.post('/checks/adding', auth, async (req, res) => {
  const checkNumber = req.body.checkNumber;
  const user_empl_id = req.body.user_empl_id;
  const card = req.body.addcard;
  const current_datetime = new Date();
  const totalCost = req.body.totalCost;
  const vat = req.body.vat;

  const query = "UPDATE `check` SET id_employee = ?, card_number = ?, print_date = ?, sum_total = ?, vat = ? WHERE check_number = ?";

  connection.query(
    query,
    [user_empl_id, card, current_datetime, totalCost, vat, checkNumber],
    (err) => {
      if (err) throw err;
      console.log("1 record updated");
      res.redirect('/checks');
    }
  );
});

router.post('/checks/prod', auth, async (req, res) => {
  const { upc, check_number, quantity, price } = req.body;
  const saleQuery = `
  INSERT INTO sale (UPC, check_number, product_number, seling_price)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
  product_number = product_number + VALUES(product_number),
  seling_price = VALUES(seling_price)
`;

const updateQuantityQuery = `
UPDATE store_product
SET products_number = products_number - ?
WHERE UPC = ?
`;


  connection.beginTransaction((err) => {
    if (err) throw err;

    connection.query(saleQuery, [upc, check_number, quantity, price], (err, result) => {
      if (err) {
        connection.rollback(() => {
          throw err;
        });
      }

      connection.query(updateQuantityQuery, [quantity, upc], (err, result) => {
        if (err) {
          connection.rollback(() => {
            throw err;
          });
        }

        connection.query('SELECT products_number FROM store_product WHERE UPC = ?', [upc], (err, result) => {
          if (err) {
            connection.rollback(() => {
              throw err;
            });
          }

          const updatedQuantity = result[0].products_number;

          if (updatedQuantity < 0) {
            connection.rollback(() => {
              const errorMessage = 'На складі міститься менше товарів!';
              errorNotification(errorMessage);
            });
          } else {
            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  throw err;
                });
              }
            });

          }
        });
      });
    });
  });
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

router.get('/checks/delete/:check_number', auth, (req, res) => {
  const checkNumber = req.params.check_number;
  const sql = `DELETE FROM \`check\` WHERE check_number = '${checkNumber}'`;
  connection.query(sql, (err) => {
    if (err) throw err;
    console.log("1 record deleted");
    res.redirect('/checks');
  });
});

router.post('/checks/delete/:check_number', auth, (req, res) => {
  const checkNumber = req.params.check_number;
  const sql = `DELETE FROM \`check\` WHERE check_number = '${checkNumber}'`;
  connection.query(sql, (err) => {
    if (err) throw err;
    console.log("1 record deleted");
    res.redirect('/checks');
  });
});

router.get('/checks/details/:check_number',  auth, checkcashier, (req, res) => {
  const checkNumber = req.params.check_number;
  const sql = `
    SELECT * 
    FROM (\`sale\`  AS sa
    INNER JOIN store_product AS st ON sa.UPC = st.UPC)
    INNER JOIN product AS p ON st.id_product = p.id_product
    WHERE check_number = '${checkNumber}'
    `;
  connection.query(sql, [checkNumber], (err, result) => {
    if (err) throw err;
    const itemsWithTotalCost = result.map((item) => {
      return {
        ...item,
        total_cost: item.product_number * item.seling_price,
      };
    });
    res.render('check-details', {
      "sale": itemsWithTotalCost,
      "product": itemsWithTotalCost[0],
      "store_product": itemsWithTotalCost[0],
      "checknumber": checkNumber,
      'iscashier': res.locals.iscashier,
      'ismanager': res.locals.ismanager,
    });
  })

});
router.get('/check/report/:check_number', auth, (req, res) => {
  const checkNumber = req.params.check_number; 
  const getAllCategories = 
  `SELECT s.*, c.*, p.*, e.*, cc.* FROM ((sale AS s INNER JOIN \`check\`AS c
ON s.check_number = c.check_number)
INNER JOIN store_product AS st
ON s.UPC = st.UPC)
INNER JOIN product AS p
ON st.id_product = p.id_product
INNER JOIN employee AS e
ON c.id_employee = e.id_employee
INNER JOIN customer_card AS cc
ON c.card_number = cc.card_number
WHERE c.check_number = '${checkNumber}'`;
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
        header {
          text-align: left;
          margin-left: 20px;
        }
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
          <h1>Чек</h1>
          <p text-align: left; margin-right: 20px; > Номер чека : ${checkNumber}<p>
          <p text-align: left; margin-right: 20px; > Працівник : ${categories[0].empl_surname} ${categories[0].empl_name}<p>
          <p text-align: left; margin-right: 20px; > Картка клієнта : ${categories[0].cust_surname} ${categories[0].cust_name}<p>
          <p text-align: left; margin-right: 20px; > Дата : 
          <script>
        var dateOfBirth = new Date('${categories[0].print_date}');
        var formattedDate = ('0' + dateOfBirth.getDate()).slice(-2) + '.' +
            ('0' + (dateOfBirth.getMonth() + 1)).slice(-2) + '.' +
            dateOfBirth.getFullYear();
        document.write('<span class="value">' + formattedDate + '</span>');
    </script><p>
    <p text-align: left; margin-right: 20px; > Всього : ${categories[0].sum_total}<p>
    <p text-align: left; margin-right: 20px; > ПДВ : ${categories[0].vat}<p>
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
  let listHTML = '';
  let currentPageHeight = 1050;

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const totalCost = category.product_number * category.seling_price;
    const categoryItem = `
      <li>
        <p><strong>Товар:</strong> ${category.product_name}</p>
        <p><strong>Кількість:</strong> ${category.product_number}</p>
        <p><strong>Ціна:</strong> ${category.seling_price}</p>
        <p><strong>Вартість:</strong> ${totalCost}</p>

      </li>
    `;

    

    currentPageHeight -= 40;
    listHTML += categoryItem;
    if (i === categories.length - 1) {
      let lastPageNumber = pageNumber;
      listHTML += `
        </ul>
        <div class="page-break">
      `;

      listHTML += `
        <p style="font-size: 12px; margin: 0; text-align: center; margin-bottom: 5px;"></p>
        </div>
      `;
    }
  }

  return `
    <ul>
      ${listHTML}
    </ul>
  `;
}


module.exports = router