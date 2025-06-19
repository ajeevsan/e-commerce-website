const validateInput = (req, res, next) => {
    const {path} = req;

    const {name, email, password} = req.body

    if(path.includes('/login')){
        if(!email || !password){
            return res.status(400).json({
                message: 'Email and password is required for login.'
            })
        }
    } else if(path.includes('/register')){
        if(!name || !email || !password){
            return res.status(400).json({
                message: 'Name, email and password is required for register.'
            })
        }
    }

    next();
}

module.exports = validateInput;