import { Schema, model } from "mongoose";

const barcodeSchema = new Schema(
  {
    link: {
      type: String,
      unique: true,
      required: true,
    },
    imageLink: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Barcode", barcodeSchema);
