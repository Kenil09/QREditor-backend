// create user register route
import express from "express";
import User from "../db/models/User.js";
import { registerSchema } from "../config/validation-schema.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";
import { verifyAdmin } from "../middleware/auth.js";
import passport from "passport";

const router = express.Router();
const env = process.env;

router.post("/register", async (req, res) => {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }

    const user = new User(value);
    await user.save();
    res
      .status(201)
      .json({ message: RESPONSE_MESSAGES.created("User"), user: user._id });
  } catch (error) {
    console.log("register ", error.message);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

router.post("/admin", async (req, res) => {
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

router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (error, user, info, status) {
    if (error) {
      return next(error);
    }
    console.log("info and user", info, user);
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
      console.log('user => ', user);
      return res.status(200).end();
      // return res.redirect(
      //   `${env.FRONTEND_URL}/${env.FRONTEND_LOGIN_SUCCESS_URL}`
      // );
    });
  })(req, res, next);
});

export default router;
