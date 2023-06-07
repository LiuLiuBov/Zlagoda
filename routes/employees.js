const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');

router.get('/employees', auth, (req, res,) => {
    const getAllEmployees = "SELECT * FROM employee ORDER BY empl_surname";
    connection.query(getAllEmployees, (err, result) => {
        if(err) throw err;
        //res.send(result)
        console.log(result);
        res.render('employees', { 'employees': result });
    })
})

router.post('/employees', auth, (req, res) => {
    const { searchsurname, occupation } = req.body;
    console.log(searchsurname);
    console.log(occupation);

    let getEmployees = "SELECT * FROM employee WHERE 1=1 ";

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

router.get('/employees/delete/:id_employee', (req, res) => {
    const idEmployee = req.params.id_employee;
    console.log(idEmployee);
    const sql = `DELETE FROM employee WHERE id_employee = '${idEmployee}'`;
    connection.query(sql, [idEmployee], (err) => {
      if (err) throw err;
      console.log("1 record deleted");
      res.redirect('/employees');
    });
  });
  
  router.get('/employees/edit/:id_employee', (req, res) => {
    const idEmployee = req.params.id_employee;
    const getEmployee = `SELECT * FROM employee WHERE id_employee = '${idEmployee}'`;
    connection.query(getEmployee,  [idEmployee], (err, result) => {
      if (err) throw err;  
      /*var emplsurname = result[0].empl_surname
      var emplname = result[0].empl_name
      var emplpatronymic = result[0].empl_patronymic
      var emplrole = result[0].empl_role
      var salary = result[0].salary
      var dateofbirth = result[0].date_of_birth
      var dateofstart = result[0].date_of_start
      var phonenumber = result[0].phone_number
      var city = result[0].city
      var street = result[0].street
      var zipcode = result[0].zip_code
      var password = result[0].password
      console.log(zipcode);*/
     res.render('editemployee', {"employee": result[0], "idemployee": idEmployee} /*, 
      {
      "idemployee": idEmployee, 
      "emplsurname": emplsurname,
      "emplname": emplname,
      "emplpatronymic":emplpatronymic,
      "emplrole":emplrole,
      "salary":salary,
      "dateofbirth":dateofbirth,
      "dateofstart":dateofstart,
      "phonenumber":phonenumber,
      "city": city,
      "street": street,
      "zipcode": zipcode,
      "password": password
    }*/);
    })
  });
  
  router.post('/employees/edit/:idemployee/editing', (req, res) => {
    const idemployee = req.params.idemployee;
    const {
      editemplfirstname,
      editempllastname,
      editemplpatronymic,
      editemplposition,
      editemplsalary,
      editempldateofbirth,
      editempldateofstart,
      editemplphone,
      editemplcity,
      editemplstreet,
      editemplzipcode,
    } = req.body;
  
    // Update the employee in the database
    const query = `
      UPDATE employee
      SET
        empl_name = ?,
        empl_surname = ?,
        empl_patronymic = ?,
        empl_role = ?,
        salary = ?,
        date_of_birth = ?,
        date_of_start = ?,
        phone_number = ?,
        city = ?,
        street = ?,
        zip_code = ?
      WHERE id_employee = ?
    `;
    const values = [
      editemplfirstname,
      editempllastname,
      editemplpatronymic,
      editemplposition,
      editemplsalary,
      editempldateofbirth,
      editempldateofstart,
      editemplphone,
      editemplcity,
      editemplstreet,
      editemplzipcode,
      idemployee,
    ];
  
    connection.query(query, values, (err, result) => {
      if (err) throw err;
      console.log('Employee updated successfully');
      res.redirect('/employees');
    });
  });


module.exports = router