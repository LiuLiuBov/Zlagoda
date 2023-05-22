const express = require('express')
//const path = require('path')
const exphbs = require('express-handlebars')
const app = express()
const indexRoutes = require('./routes/index')
const categoriesRoutes = require('./routes/categories')
const customersRoutes = require('./routes/customers')
const employeesRoutes = require('./routes/employees')
const mysql = require('./utils/database')

const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs'
})

app.use(express.static('public'))//для css
app.use(express.urlencoded({extended: false}))
app.use(categoriesRoutes)
app.use(customersRoutes)
app.use(indexRoutes)
app.use(employeesRoutes)
//--------------------------------------------------------
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')//реєструємо двіжок хендлбарс
app.set('views', 'views')
//--------------------------------------------------------

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

