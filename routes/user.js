// create user register route
import express from "express";
import User from "../db/models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema } from "../config/validation-schema.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

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

router.post("/admin", verifyAdmin, async (req, res) => {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }

    const user = new User({ ...value, role: "admin" });
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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("User") });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: RESPONSE_MESSAGES.UNAUTHORIZED });
    }
    const jwtConfig = {
      expiresIn: "2h",
      issuer: process.env.DOMAIN_URL,
      audience: process.env.DOMAIN_URL,
      subject: String(user._id),
    };
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, jwtConfig);
    res.status(STATUS_CODES.SUCCESS).json({ token });
  } catch (error) {
    console.log("login ", error.message);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

export default router;
