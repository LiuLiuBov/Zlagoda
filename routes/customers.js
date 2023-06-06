const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const { v4: uuidv4 } = require('uuid');

router.get('/customers', auth, (req, res,) => {
    const getAllCustomers = "SELECT * FROM customer_card";
    connection.query(getAllCustomers, (err, result) => {
        if(err) throw err;
        //res.send(result)
        console.log(result);
        res.render('customers', { 'customers': result });
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

module.exports = router