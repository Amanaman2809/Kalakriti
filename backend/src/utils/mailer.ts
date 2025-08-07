import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  port: 465,
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async (options: SendMailOptions) => {
  try {
    const mailOptions = {
      from: `"Kalakriti" <${process.env.EMAIL_USER}>`,
      ...options,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
