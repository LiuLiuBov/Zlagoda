const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const { v4: uuidv4 } = require('uuid');
const checkmanager = require('../middleware/ismanager')
const checkcashier = require('../middleware/iscashier')

router.get('/customers', auth, checkcashier, (req, res,) => {
  const getAllCustomers = "SELECT * FROM customer_card ORDER BY cust_surname";
    connection.query(getAllCustomers, (err, result) => {
        if(err) throw err;
        //res.send(result)
        console.log(result);
        res.render('customers', { 'customers': result, 
        "iscashier": res.locals.iscashier,
        "ismanager": res.locals.ismanager });
    })
})

router.post('/customers', auth, (req, res) => {
    const { searchpercent } = req.body;
    console.log(searchpercent);

    let getCustomers = `SELECT * FROM customer_card WHERE percent = '${searchpercent}'`;

    connection.query(getCustomers, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('customers', { 'customers': result });
    });
});

router.get('/customers/add', auth, (req, res,) => {
    res.render('create-customer')
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

module.exports = router