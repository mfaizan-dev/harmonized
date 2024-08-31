require("dotenv").config();
const { auth } = require("../firebase");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

const sendVerificationCodeToPhoneNumber = async (phoneNumber, code) => {
  await twilioClient.messages
    .create({
      body: `Your verification code is: ${code}`,
      from: process.env.TWILIO_NUMBER,
      to: phoneNumber,
    })
    .then((message) => console.log(message.sid));
};

const verifySmsCode = async (phoneNumber, code) => {
  try {
    const verificationCheck = await twilioClient.verify.v2
      .services("VA05d4a2f2c71b9b5b3aea594a3ba321ef")
      .verificationChecks.create({ to: phoneNumber, code: code });
    return verificationCheck?.valid;
  } catch (error) {
    console.error("Error verifying code:", error);
    return false;
  }
};

module.exports = {
  transporter,
  twilioClient,
  sendVerificationCodeToPhoneNumber,
  verifySmsCode,
};
