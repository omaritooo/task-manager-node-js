import nodemailer, { Transporter } from 'nodemailer';
interface IOptions {
  email: string;
  subject: string;
  text: string;
}

interface ITransporter {
  auth: {
    user: string;
    pass: string;
  };
  host: string;
  port: number;
}

export const sendEmail = async (options: IOptions) => {
  const transporter = nodemailer.createTransport({
    auth: {
      user: process.env.EMAIL_USER as string,
      pass: process.env.EMAIL_PASSWORD as string,
    },
    host: process.env.EMAIL_HOST as string,
    port: 25,
  });
  transporter.verify((err, success) => {
    if (err) {
    }
  });
  const mailOptions = {
    from: 'Omar Ashraf <omarash227@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};
