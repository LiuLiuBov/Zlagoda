const { Router } = require('express')
const router = Router()
const auth = require('../middleware/auth')
const connection = require('../utils/database')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const checkmanager = require('../middleware/ismanager')
const checkrole = require('../middleware/check-role')
const notifier = require('node-notifier')
const path = require('path');
const pdf = require('html-pdf');
const fs = require('fs');

router.get('/employees', auth, checkmanager, checkrole, (req, res,) => {
  const getAllEmployees = "SELECT * FROM employee ORDER BY empl_surname";
  
  connection.query(getAllEmployees, (err, result) => {
    if (err) throw err;
    //res.send(result)
    console.log(result);
    res.render('employees', { 'employees': result, "ismanager": res.locals.ismanager });
  })
})

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

router.post('/employees', auth, checkmanager, checkrole, (req, res) => {
  const { searchsurname, occupation} = req.body;
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
    res.render('employees', { 'employees': result, 'iscashier': res.locals.iscashier,
    'ismanager': res.locals.ismanager });
  });
});

router.get('/employees/add', auth, checkmanager, checkrole, (req, res,) => {
  res.render('create-employee', {
    'iscashier': res.locals.iscashier,
    'ismanager': res.locals.ismanager,
  })
})

router.post('/employees/adding', auth, checkmanager, async (req, res) => {
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
    addempllogin,
    addemplpassword
  } = req.body;

  const hashPassword = await bcrypt.hash(addemplpassword, 5);
  const addemplid = uuidv4().slice(0, 10);

  const checkQuery = "SELECT COUNT(*) AS count FROM employee WHERE login = ?";

  connection.query(checkQuery, [addempllogin], (err, results) => {
    if (err) throw err;

    if (results[0].count > 0) {
      errorNotification('Login must be unique.');
      res.redirect('/employees/add');
    } else {
      const insertQuery = "INSERT INTO employee (id_employee, empl_name, empl_surname, empl_patronymic, empl_role, salary, date_of_birth, date_of_start, phone_number, city, street, zip_code, login, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

      connection.query(
        insertQuery,
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
          addempllogin,
          hashPassword],
        (err) => {
          if (err) throw err;
          console.log("1 record inserted");
          res.redirect('/employees');
        });
    }
  });
});


router.get('/employees/delete/:id_employee', auth, checkmanager, (req, res) => {
  const idEmployee = req.params.id_employee;
  console.log(idEmployee);

  const user_id = res.locals.user_id;
  const getCurrentUser = `
    SELECT * FROM employee WHERE login = '${user_id}' 
  `;

  connection.query(getCurrentUser, (err, userResult) => {
    if (err) throw err;

    if (userResult.length > 0 && userResult[0].id_employee === idEmployee) {
      // User is trying to delete their own account
      errorNotification('You can not delete yourself!');
      res.redirect('/employees'); // Redirect back to employees list or error page
    } else {
      const checkChecks = `SELECT * FROM \`check\` WHERE id_employee = '${idEmployee}'`;
      connection.query(checkChecks, (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
          // If there are associated checks, show error
          errorNotification('Can not delete cashiers with existing checks. Firstly delete the checks!');
          res.redirect('/employees');
        } else {
          // If no associated checks, proceed with deletion
          const sql = `DELETE FROM employee WHERE id_employee = '${idEmployee}'`;
          connection.query(sql, (err) => {
            if (err) throw err;
            console.log("1 record deleted");
            res.redirect('/employees');
          });
        }
      });
    }
  });
});




router.get('/employees/edit/:id_employee', auth, checkrole, checkmanager, (req, res) => {
  const idEmployee = req.params.id_employee;
  const getEmployee = `SELECT * FROM employee WHERE id_employee = '${idEmployee}'`;
  connection.query(getEmployee, [idEmployee], (err, result) => {
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
    res.render('editemployee', { "employee": result[0], "idemployee": idEmployee } /*, 
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

router.post('/employees/edit/:idemployee/editing', auth, checkmanager, (req, res) => {
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

router.get('/employees/report', auth, (req, res) => {
  const getAllCategories = "SELECT * FROM employee ORDER BY empl_name";
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
          <span style="font-size: 10px; margin: 0; text-align: right; margin-top: 10px; margin-right: 1px;">Supermarket "ZLAGODA"</span>
          <h1>Employees report</h1>
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
        <td>${category.empl_name}</td>
        <td>${category.empl_surname}</td>
        <td>${category.empl_patronymic}</td>
        <td>${category.empl_role}</td>
        <td>${category.salary}</td>
        <td><script>
        var dateOfBirth = new Date('${category.date_of_birth}');
        var formattedDate = ('0' + dateOfBirth.getDate()).slice(-2) + '.' +
            ('0' + (dateOfBirth.getMonth() + 1)).slice(-2) + '.' +
            dateOfBirth.getFullYear();
        document.write('<span class="value">' + formattedDate + '</span>');
    </script></td>
        <td><script>
        var dateOfBirth = new Date('${category.date_of_start}');
        var formattedDate = ('0' + dateOfBirth.getDate()).slice(-2) + '.' +
            ('0' + (dateOfBirth.getMonth() + 1)).slice(-2) + '.' +
            dateOfBirth.getFullYear();
        document.write('<span class="value">' + formattedDate + '</span>');
    </script></td>
        <td>${category.phone_number}</td>
        <td>${category.city}</td>
        <td>${category.street}</td>
        <td>${category.zip_code}</td>
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
            <th>Name</th>
            <th>Surname</th>
            <th>Patronymic</th>
            <th>Role</th>
            <th>Salary</th>
            <th>Date of birth</th>
            <th>Date of start</th>
            <th>Phone number</th>
            <th>City</th>
            <th>Street</th>
            <th>Index</th>
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
          <th>Name</th>
            <th>Surname</th>
            <th>Patronymic</th>
            <th>Role</th>
            <th>Salary</th>
            <th>Date of birth</th>
            <th>Date of start</th>
            <th>Phone number</th>
            <th>City</th>
            <th>Street</th>
            <th>Index</th>
        </tr>
        </thead>
        <tbody>
          ${tableHTML}
        </tbody>
      </table>
    `;
}


module.exports = router