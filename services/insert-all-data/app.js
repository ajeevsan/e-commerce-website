require('dotenv').config()
const axios = require('axios')
const mongoose = require('mongoose')

//! connect to mongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));


//! define schema
const productSchema = new mongoose.Schema({}, {strict: false})
const Product = mongoose.model("Product",productSchema)

//! fetch data from dummyjson and insert
async function insertProducts(){
    try {
        const response = await axios.get("https://dummyjson.com/products?limit=200"); 
        const products = response.data.products;

        //! insert into mongoDB
        await Product.insertMany(products)
        console.log('Products inserted successfully!')
    } catch (error) {
        console.error('Error while inserting the data ',error)
    } finally {
        mongoose.disconnect()
    }
}

insertProducts()