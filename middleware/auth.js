import jwt from "jsonwebtoken";
import User from "../db/models/User.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";

const verifyUser = async (req, res, next) => {
  const token = req.header("Authorization");
  console.log("token", token);
  if (!token) {
    return res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: RESPONSE_MESSAGES.UNAUTHORIZED });
  }
  try {
    const decoded = jwt.verify(
      String(token).replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    if (decoded.id) {
      const user = await User.findById(decoded.id).lean();
      if (user) {
        req.user = user;
        return next();
      }
    }

    return res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: RESPONSE_MESSAGES.UNAUTHORIZED });
  } catch (error) {
    res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: RESPONSE_MESSAGES.UNAUTHORIZED });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    await verifyUser(req, res, async () => {
      if (req.user.role === "admin") {
        return next();
      } else {
        return res
          .status(STATUS_CODES.UNAUTHORIZED)
          .json({ message: RESPONSE_MESSAGES.UNAUTHORIZED });
      }
    });
  } catch (error) {
    res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: RESPONSE_MESSAGES.UNAUTHORIZED });
  }
};

export { verifyUser, verifyAdmin };
