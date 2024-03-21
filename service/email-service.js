import {SendMailClient} from 'zeptomail';

const url = process.env.MAIL_BASE_URL;

const token = process.env.ZEPTO_TOKEN;

export const sendMail = async (recipients = [], subject, body) => {
  let client = new SendMailClient({ url, token });
  const recips = recipients.map((r) => ({
    email_address: {
      address: r.email,
      name: r.firstName + " " + r.lastName,
    },
  }));
  return client
    .sendMail({
      bounce_address: process.env.BOUNCE_ADDRESS,
      from: {
        address: process.env.NO_REPLAY_MAIL,
        name: process.env.FROM_NAME,
      },
      to: recips,
      subject: subject,
      htmlbody: body,
    })
    .then((resp) => console.log("success", resp))
    .catch((error) => console.log("error", error));
};
