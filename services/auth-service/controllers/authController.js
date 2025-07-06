const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
    
        //! Check if user exists
        const existing = await User.findOne({ email });
        if(existing) return res.status(400).json({ msg: 'User exists'});

        //! Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        //! Generate Token
        const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '1h'});
        res.status(201).json({ message: 'User Registered Successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error'});
    }
};

exports.login = async (req, res) => {
    try {
    
        const {email, password} = req.body;
        const user = await User.findOne({ email });

        if(!user || !(await bcrypt.compare(password, user.password))){
            console.log('Issue in the login route');
            
            return res.status(401).json({msg: 'Invalid Credentials'})
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        return res.status(200).json({ message: 'Login successful', name: user.name, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server Error'})
    }
}

