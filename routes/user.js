// create user register route
import express from "express";
import User from "../db/models/User.js";
import { otpVerifyValidation, registerSchema, resetPasswordValidation, updateSchema, verifyResetPasswordValidation } from "../config/validation-schema.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";
import { verifyAdmin } from "../middleware/auth.js";
import passport from "passport";
import Barcode from "../db/models/Barcode.js";
import { comparePasswords, createToken, decodeToken, hashPassword } from "../utils/cipher-service.js";
import { sendMail } from "../service/email-service.js";
import { passwordChangeNotification, passwordResetEmail, verifyEmail } from "../utils/template.js";
import { generateOTP, validateOTP } from "../utils/common-function.js";

const router = express.Router();
const env = process.env;

// register user
router.post("/register", async (req, res) => {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }
    
    const user = new User({ ...value, provider: "local", role: "user" });
    
    const otp = generateOTP()
    user.otpInfo = {
      otp,
      otpCreateDate : new Date
    };

    await user.save();

    if (value.link) {
      const link = await Barcode.findById(value.link);
      if (link) {
        link.user = user._id;
        await link.save();
      }
    }

    await sendMail(
      [{ email: value?.email, name: value.firstName + value.lastName }],
        "Email verify OTP",
        verifyEmail(value, otp)
      );

    res
      .status(201)
      .json({ message: RESPONSE_MESSAGES.created("User"), user: user._id });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: RESPONSE_MESSAGES.ALREADY_EXISTS });
    }
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// create admin only allowed by admin
router.post("/admin", verifyAdmin, async (req, res) => {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }

    const user = new User({ ...value, role: "admin", provider: "local" });
    await user.save();
    res
      .status(STATUS_CODES.CREATED)
      .json({ message: RESPONSE_MESSAGES.created("Admin"), user: user._id });
  } catch (error) {
    console.log("admin create ", error.message);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// login user
router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (error, user, info, status) {
    if (error) {
      return next(error);
    }
    if (info && info?.message) {
      return res.status(400).json({ message: info.message });
    }
    if (!user) {
      return res.redirect(
        `${env.FRONTEND_URL}/${env.FRONTEND_LOGIN_FAILURE_URL}`
      );
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({ user }).end();
      // return res.redirect(
      //   `${env.FRONTEND_URL}/${env.FRONTEND_LOGIN_SUCCESS_URL}`
      // );
    });
  })(req, res, next);
});

router.put("/update/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { value, error } = updateSchema.validate(req.body);
    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: RESPONSE_MESSAGES.not_found("User") });
    }

    if (value.password) {
      // Check if new password is provided in the request body
      if (!value.newPassword) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "New password is required" });
      }

      // Compare old password with the hashed password stored in the database
      const isMatch = await comparePasswords(value.password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
      // Update user information
      user.password = value.newPassword;
      await user.save();
    } else {
      user.set(value);
      await user.save();
    }
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.SUCCESS, user: user._id });
  } catch (error) {
    console.error("Error updating user:", error);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// forgot-password
router.post("/reset-password", async (req, res) => {
  try{
    const {value, error} = resetPasswordValidation.validate(req.body);
    if (error) {
      return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: error.message });
    }
    const clientUrl = process?.env?.FRONTEND_URL

    let { email } = value;
    const user = await User.findOne({
      email: email
    });

    if (!user) {
      return res.status(404).json({ message: RESPONSE_MESSAGES.not_found("User") });
    }
    
    const token = createToken( { user_id: user._id, email }, "1h" );

    const verificationLink = `${clientUrl}/reset?token=${token}`;

    await sendMail(
        [{ email, name: user.firstName + user.lastName }],
        "We received a request to update your password",
        passwordResetEmail(user, verificationLink)
      );
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.EMAIL_SEND_SUCCESSFULLY, user: user._id });
  }  catch (error) {
    console.error("Error reset password:", error);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
})

router.post("/reset-password/verify", async (req, res) => {
  try{
    const {value, error} = verifyResetPasswordValidation.validate(req.body);

    if (error) {
      return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: error.message });
    }

    const {token, password} = value;

    const userDecode = await decodeToken(token)

     if (!userDecode) {
        return res
          .status(400)
          .send(
            "Reset password link has already been used, please generate again."
          );
      }

    const encryptedPassword = await hashPassword(password);

    const user = await User.findByIdAndUpdate(
        userDecode.user_id,
        {
          password: encryptedPassword,
        },
        { new: true }
      );

    if (!user) {
      return res.status(404).json({ message: RESPONSE_MESSAGES.not_found("User") });
    }

      await sendMail(
        [{ email: userDecode.email, name: user.firstName + user.lastName }],
        "Your password was set",
        passwordChangeNotification(user)
      );

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.updated('password'), user: user._id });
  }  catch (error) {
    console.error("Error reset password:", error);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
})

// email verify
router.post("/otp-verify", async (req, res) => {
  try{
    const {value, error} = otpVerifyValidation.validate(req.body);
    if (error) {
      return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: error.message });
    }

    let { email, otp } = value;
    const user = await User.findOne({
      email: email
    });

    if (!user) {
      return res.status(404).json({ message: RESPONSE_MESSAGES.not_found("User") });
    }

    if (user.emailVerified) {
      return res.status(200).json({ message: RESPONSE_MESSAGES.EMAIL_ALREADY_VERIFIED });
    }
    
    const isValid = validateOTP(user?.otpInfo?.otpCreateDate)
    
    if(!isValid){
      return res.status(404).json({ message: RESPONSE_MESSAGES.OTP_IS_EXPIRED });
    }
    if(user?.otpInfo?.otp !== otp){
      return res.status(404).json({ message: RESPONSE_MESSAGES.OTP_NOT_METCHED });
    }

    user.emailVerified = true;
    user.save()

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.EMAIL_VERIFIED_SUCCESSFULLY, user: user._id });
  }  catch (error) {
    console.error("Error reset password:", error);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
})



export default router;
