import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";

const verifyUser = async (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      return next();
    } else {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: RESPONSE_MESSAGES.UNAUTHORIZED });
    }
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
