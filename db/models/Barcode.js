import { Schema, model } from "mongoose";

const barcodeSchema = new Schema(
  {
    name: {
      type: String,
    },
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
    isActive: {
      type: Boolean,
      default: true,
    },
    storedInfo: {
      infoType: {
        type: String,
        enum: ['image', 'link', 'phoneNumber', 'pdf']
      },
      link: {
        type: String,
      },
    }
  },
  {
    timestamps: true,
  }
);

export default model("Barcode", barcodeSchema);
