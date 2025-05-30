const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: String,
    image: String,
    category: String,
    isFeatured: Boolean,
    discount: Number
}, {timestamps: true})

module.exports = mongoose.model('Product', productSchema)