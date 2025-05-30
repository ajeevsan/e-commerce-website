const axios = require('axios')
const mongoose = require('mongoose')
const Product = require('./models/Product')
require('dotenv').config()

const MONGO_URI = process.env.MONGO_URI

async function seedProducts(){
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('Connected to Product DB');

        const {data} = await axios.get('https://fakestoreapi.com/products');

        const formatedData = data.map( (product) =>( {
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
        }))

        await Product.insertMany(formatedData)
        console.log("Product data inserted succesfully");
        process.exit(0);
    } catch (error) {
        console.error(err)
        process.exit(1)
    }
}


seedProducts();