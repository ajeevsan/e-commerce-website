const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = async function sendEmail(to, body) {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: 'Your OTP Code',
        text: body
    });
};