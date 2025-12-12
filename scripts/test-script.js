const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  service : "gmail",
  auth: {
    user: "",   // enter your email
    pass: "",   // enter your password 
  },
});

// Wrap in an async IIFE so we can use await.
const sendMailer = async (mailTo,subject,text,html) => {
  const info = await transporter.sendMail({
    from: '"User Approval Assignment Syster" <saqlainkoser@gmail.email>',
    to: mailTo,
    subject: subject,
    text: text, // plain‑text body
    html : html
  });

  console.log("Message sent:", info.messageId);
};

module.exports = {sendMailer}