/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as nodemailer from 'nodemailer';

export const SendEmail = async (html: string, to: string, title: string) => {
  const transpoter = nodemailer?.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: '"Auth01" ',
    to,
    subject: title,
    html,
  };
  await transpoter.sendMail(mailOptions);
};
