import { COMPANY_NAME, SUPPORT_EMAIL } from "./constants.js";

export const passwordResetEmail = (user, link) => {
  const fullName = user.firstName + " " + user.lastName;
  return `
  <div style="background-color: #f2f2f2; padding: 20px;">
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; border: 1px solid #dddddd;">
    <tr>
      <td style="padding: 20px;">
        <h2 style="text-align: center; color: #333333;">Email Verification - Complete Your Signup</h2>
        <p style="font-size: 16px; color: #333333;">Hi ${fullName},</p>
        <p style="font-size: 16px; color: #333333;">We received a request that you want to update your password. You can do this by selecting the button below. </p>
        <p style="text-align: center;">
          <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #4caf50; color: #ffffff; border-radius: 4px;">Update password</a>
        </p>
        <p style="font-size: 16px; color: #333333;">This request expires in 4 hours.</p>
        <p style="font-size: 16px; color: #333333;">If you didn't make this request, you don't need to do anything.</p>
        <p style="font-size: 16px; color: #333333;">If you have any questions or need assistance, feel free to reach out to our support team at ${SUPPORT_EMAIL}.</p>
        <p style="font-size: 16px; color: #333333;">Welcome aboard, and we look forward to serving you!</p>
        <p style="font-size: 16px; color: #333333;">Best regards,<br>${COMPANY_NAME}</p>
      </td>
    </tr>
  </table>
</div>
`;
};

export const passwordChangeNotification = (user) => {
  const fullName = user.firstName + " " + user.lastName;
  return `
  <div style="background-color: #f2f2f2; padding: 20px;">
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; border: 1px solid #dddddd;">
    <tr>
      <td style="padding: 20px;">
        <h2 style="text-align: center; color: #333333;">Email Verification - Reset Password</h2>
        <p style="font-size: 16px; color: #333333;">Hi ${fullName},</p>
        <p style="font-size: 16px; color: #333333;">This email confirms that you recently added or changed the password for user account ${fullName}. No further action is required. </p>
     
        <p style="font-size: 16px; color: #333333;">Please contact our Support team at ${SUPPORT_EMAIL} if you did not authorize this change.</p>

        <p style="font-size: 16px; color: #333333;">Best regards,<br>${COMPANY_NAME}</p>
      </td>
    </tr>
  </table>
</div>
`;
};

export const verifyEmail = (user,otp) => {
  const fullName = user.firstName + " " + user.lastName;
  return `
  <div style="background-color: #f2f2f2; padding: 20px;">
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; border: 1px solid #dddddd;">
    <tr>
      <td style="padding: 20px;">
        <h2 style="text-align: center; color: #333333;">Email Verification - OTP verify</h2>
        <p style="font-size: 16px; color: #333333;">Hi ${fullName},</p>
        <p style="font-size: 16px; color: #333333;">Thank you for signing up with our platform. To complete your registration and activate your account, please verify your email address by clicking the verification link below:</p>
        <p style="text-align: center;">
          <a style="display: inline-block; padding: 10px 20px; background-color: #4caf50; color: #ffffff; border-radius: 4px;">Verify Otp : ${otp}</a>
        </p>
        <p style="font-size: 16px; color: #333333;">By verifying your email, you will gain full access to our platform's features and services. Please note that this link is valid for 2 hours and will expire after that.</p>
        <p style="font-size: 16px; color: #333333;">If you did not create an account with us, please ignore this email. No further action is required.</p>
      </td>
    </tr>
  </table>
</div>
`;
};