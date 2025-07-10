require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json());


const productRuotes = require('./routes/productRoutes')
app.use('/api/products/', productRuotes)

const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || localhost

app.listen(PORT, HOST, () => console.log('Product Service is running on the port ', PORT))
