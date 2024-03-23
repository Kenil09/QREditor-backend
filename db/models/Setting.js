import { Schema, model } from "mongoose";

const settingSchema = new Schema(
  {
    topBannerText: {
      type: String,
    },
    bottomBannerText: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

console.log('code running');
export default model("Setting", settingSchema);
