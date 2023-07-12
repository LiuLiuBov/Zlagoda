const { Router } = require('express')
const router = Router()
const auth = require('../middleware/auth')
const checkcashier = require('../middleware/check-role')
const connection = require('../utils/database')


router.get('/', auth, checkcashier, (req, res) => {
    const getAllChecks = "SELECT ch.*, e.empl_surname FROM `check` AS ch INNER JOIN employee AS e ON ch.id_employee = e.id_employee LIMIT 3";
    const getAllCustomers = "SELECT * FROM customer_card ORDER BY cust_surname LIMIT 3";
    const getAllProducts = "SELECT p.id_product, p.category_number, c.category_name, p.product_name, p.caracteristics FROM product p JOIN category c ON p.category_number = c.category_number ORDER BY p.product_name LIMIT 3";

    connection.query(getAllProducts, (err, products) => {
        if (err) throw err;
    connection.query(getAllChecks, (err, checks) => {
        if (err) throw err;

    connection.query(getAllCustomers, (err, customers) => {
        if (err) throw err;
        res.render('index', {
            "iscashier": res.locals.iscashier,
            "ismanager": res.locals.ismanager,
            'customers': customers,
            'checks' : checks,
            'products' : products
        })
    })
})
    })
})


module.exports = router