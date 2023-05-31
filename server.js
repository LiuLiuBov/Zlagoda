const express = require('express')
//const path = require('path')
const exphbs = require('express-handlebars')
const app = express()
const indexRoutes = require('./routes/index')
const categoriesRoutes = require('./routes/categories')
const session = require('express-session')
const customersRoutes = require('./routes/customers')
const employeesRoutes = require('./routes/employees')
const authRoutes = require('./routes/auth')
const mysql = require('./utils/database')
const sessionStore = require('./utils/session_db')

const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    noLayout: 'noLayout' // Layout to be used for pages without layout
})

app.use(express.static('public'))//для css
app.use(express.urlencoded({extended: false}))

app.use(session({
    secret: 'some secret value',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}))

app.use(categoriesRoutes)
app.use(customersRoutes)
app.use(indexRoutes)
app.use(employeesRoutes)
app.use(authRoutes)
//--------------------------------------------------------
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')//реєструємо двіжок хендлбарс
app.set('views', 'views')
//--------------------------------------------------------

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

