import { Schema, model } from "mongoose";
import { hashPassword } from "../../utils/cipher-service.js";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    provider: {
      type: String,
      enum: ['google', 'facebook', 'local'],
      required: [true, 'Provider is required'],
    },
    userProviderId: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    otpInfo: {
      otp: {
        type: String,
      },
      otpCreateDate:{
        type: Date
      }
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  next();
});

export default model("User", userSchema);
