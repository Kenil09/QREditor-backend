import {SendMailClient} from 'zeptomail';

const url = "api.zeptomail.com/";

const token = process.env.ZEPTO_TOKEN || 'Zoho-enczapikey wSsVR60g+UOmCKp7yTz8Irs+nFUGAQz3Q059jgShuX78HvzCpsc/kBCcVgH0GfYZGGRtFjUQoektyhkH1WFai4grzF4EWiiF9mqRe1U4J3x17qnvhDzIWGlVlheIK4sOwgxvkmNmFc4m+g==';

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
      bounce_address: "do-not-reply@bounce.churchofchristsingles.com",
      from: {
        address: "noreply@churchofchristsingles.com",
        name: "QREditor.com",
      },
      to: recips || [
        {
          email_address: {
            address: "tarun02@yopmail.com",
            name: "Tarun",
          },
        },
      ],
      subject: subject || "Test Email",
      htmlbody: body || "<div><b> Test email sent successfully.</b></div>",
    })
    .then((resp) => console.log("success", resp))
    .catch((error) => console.log("error", error));
};
