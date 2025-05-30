const Product = require('../models/Product')


//! api to get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products)
    } catch (error) {
        console.error()
        res.status(500).json({ msg: 'No Records Found'})
    }
}

//! api to get all fetured products
exports.getFeaturedProducts = async (req, res) => {
    const featuredProducts = await Product.find({ isFeatured: true })
    res.status(200).json(featuredProducts)
}

//! api to get all categories
exports.getCategories = async(req, res) => {
    const categories = await Product.distinct("category")
    res.status(200).json(categories)
}

//! api to get all offers
exports.getOffers = async(req, res) => {
    const offers = await Product.find({ discount: { $gt: 0 }})
    res.status(200).json(offers)
}