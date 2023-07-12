const express = require('express')
//const path = require('path')
const exphbs = require('express-handlebars')
const app = express()
const indexRoutes = require('./routes/index')
const profileRoutes = require('./routes/profile')
const categoriesRoutes = require('./routes/categories')
const productsinmarketRoutes = require('./routes/productsinmarket')
const checksRoutes = require('./routes/checks')
const session = require('express-session')
const customersRoutes = require('./routes/customers')
const employeesRoutes = require('./routes/employees')
const productsRoutes = require('./routes/products')
const authRoutes = require('./routes/auth')
const mysql = require('./utils/database')
const sessionStore = require('./utils/session_db')
const moment = require('moment');
const flash = require('connect-flash');


const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    noLayout: 'noLayout',
    helpers: {
        formatDate: function(date) {
          const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
          return date.toLocaleDateString(undefined, options);
        },
        defaultDate: function (value, defaultValue) {
          return value || moment().format(defaultValue);
        },
        selectedOption: function(value, selectedValue) {
          return value === selectedValue ? 'selected' : '';
        }
      }
})

app.use(flash());

app.use(express.static('public'))//для css
app.use(express.urlencoded({extended: false}))

app.use(session({
    secret: 'some secret value',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}))
app.use(profileRoutes)
app.use(productsinmarketRoutes)
app.use(checksRoutes)
app.use(categoriesRoutes)
app.use(customersRoutes)
app.use(indexRoutes)
app.use(employeesRoutes)
app.use(authRoutes)
app.use(productsRoutes)

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')//реєструємо двіжок хендлбарс
app.set('views', 'views')

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

