// create user register route
import express from "express";
import User from "../db/models/User.js";
import { registerSchema, updateSchema } from "../config/validation-schema.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";
import { verifyAdmin } from "../middleware/auth.js";
import passport from "passport";
import Barcode from "../db/models/Barcode.js";
import { comparePasswords } from "../utils/password.js";

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
    await user.save();

    if (value.link) {
      const link = await Barcode.findById(value.link);
      if (link) {
        link.user = user._id;
        await link.save();
      }
    }
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
      console.log("user => ", user);
      return res.status(200).end();
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


export default router;
