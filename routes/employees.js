const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');

router.get('/employees', auth, (req, res,) => {
    const getAllEmployees = "SELECT * FROM employee";
    connection.query(getAllEmployees, (err, result) => {
        if(err) throw err;
        //res.send(result)
        console.log(result);
        res.render('employees', { 'employees': result });
    })
})

/*router.post('/employees', auth, (req, res,) => {
    const {searchsurname} = req.body;
    console.log(searchsurname);
    const getEmployees = `SELECT * FROM employee WHERE empl_surname = '${searchsurname}'`;
    connection.query(getEmployees, (err, result) => {
        if(err) throw err;
        console.log(result);
        res.render('employees', { 'employees': result });
    })
})*/

router.post('/employees', auth, (req, res) => {
    const { searchsurname, occupation } = req.body;
    console.log(searchsurname);
    console.log(occupation);

    let getEmployees = "SELECT * FROM employee WHERE 1=1";

    if (searchsurname) {
        getEmployees += ` AND empl_surname = '${searchsurname}'`;
    }

    if (occupation && occupation !== "none") {
        getEmployees += ` AND empl_role = '${occupation}'`;
    }

    connection.query(getEmployees, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.render('employees', { 'employees': result });
    });
});

router.get('/employees/add', auth, (req, res,) => {
    res.render('create-employee')
})

router.post('/employees/adding', auth, async (req, res) => {
    const {
        addemplfirstname,
        addempllastname,
        addemplpatronymic,
        addemplposition,
        addemplsalary,
        addempldateofbirth,
        addempldateofstart,
        addemplphone,
        addemplcity,
        addemplstreet,
        addemplzipcode,
        addemplpassword
    } = req.body;

    const hashPassword = await bcrypt.hash(addemplpassword, 5)
    const addemplid = uuidv4().slice(0, 10);

    const query = "INSERT INTO employee (id_employee, empl_name, empl_surname, empl_patronymic, empl_role, salary, date_of_birth, date_of_start, phone_number, city, street, zip_code, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    connection.query(
        query, 
        [addemplid,
        addemplfirstname,
        addempllastname,
        addemplpatronymic,
        addemplposition,
        addemplsalary,
        addempldateofbirth,
        addempldateofstart,
        addemplphone,
        addemplcity,
        addemplstreet,
        addemplzipcode,
        hashPassword], 
        (err) => {
            if (err) throw err;
            console.log("1 record inserted");
            res.redirect('/employees');
        });
});


module.exports = router