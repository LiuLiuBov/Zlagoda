const express = require('express')
const path = require('path')
const exphbs = require('express-handlebars')
const app = express()

const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs'
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')//реєструємо двіжок хендлбарс
app.set('views', 'views')

app.get('/', (req, res,) => {
    res.render('index')
})

app.get('/customers', (req, res,) => {
    res.render('customers')
})

app.get('/customers/add', (req, res,) => {
    res.render('create-customer')
})


const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

