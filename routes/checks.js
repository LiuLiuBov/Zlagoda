const { Router } = require('express')
const router = Router()
const connection = require('../utils/database')
const auth = require('../middleware/auth')
var notifier = require('node-notifier')
const path = require('path')
const checkcashier = require('../middleware/iscashier')

router.get('/checks', auth, checkcashier, (req, res) => {
  const deleteZeroTotalChecks = "DELETE FROM `check` WHERE sum_total = 0";
  const getAllChecks = "SELECT ch.*, e.empl_surname FROM `check` AS ch INNER JOIN employee AS e ON ch.id_employee = e.id_employee";
  const user_empl_id = res.locals.user_empl_id;
  const user_name = res.locals.user_name;
  const user_id = res.locals.user_id;
  console.log(user_id);

  connection.query(deleteZeroTotalChecks, (err) => {
    if (err) throw err;

    connection.query(getAllChecks, (err, result) => {
      if (err) throw err;

      console.log(result);
      res.render('checks', { 'checks': result });
    });
  });
});



router.get('/checks/add', auth, (req, res) => {
  const user_name = res.locals.user_name;
  const user_id = res.locals.user_id;
  const user_empl_id = res.locals.user_empl_id;
  const getAllProducts = "SELECT * FROM store_product AS st INNER JOIN product AS p ON st.id_product = p.id_product";
  const insertQuery = "INSERT INTO `check` (check_number, id_employee, print_date, sum_total, vat) VALUES (?, ?, ?, 0, 0)";

  generateCheckNumber((checkNumber) => {
    const current_datetime = new Date();
    const values = [checkNumber, user_empl_id, current_datetime];
    connection.query(insertQuery, values, (err, result) => {
      if (err) throw err;
      connection.query(getAllProducts, (err, products) => {
        if (err) throw err;

        res.render('create-check', { user_name, user_id, user_empl_id, checkNumber, products });
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
  const current_datetime = new Date();
  const totalCost = req.body.totalCost;
  const vat = req.body.vat;

  const query = "UPDATE `check` SET id_employee = ?, print_date = ?, sum_total = ?, vat = ? WHERE check_number = ?";

  connection.query(
    query,
    [user_empl_id, current_datetime, totalCost, vat, checkNumber],
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

router.get('/checks/details/:check_number', (req, res) => {
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
    });
  })

});
module.exports = router