import express from "express";
import Barcode from "../db/models/Barcode.js";
import { bulkBarcodeCreateSchema } from "../config/validation-schema.js";
import { verifyAdmin } from "../middleware/auth.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";
import multer from "multer";
import Jimp from "jimp";

const router = express.Router();

router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { value, error } = bulkBarcodeCreateSchema.validate(req.body);

    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }

    const barcodeData = [];

    for (let i = 0; i < value.amount; i++) {
      const barcodeLink = `${process.env.DOMAIN_URL}/${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      barcodeData.push({ link: barcodeLink });
    }

    const barCodes = await Barcode.insertMany(barcodeData);

    res
      .status(STATUS_CODES.CREATED)
      .json({ message: RESPONSE_MESSAGES.created("Barcodes"), barCodes });
  } catch (error) {
    console.log("Bulk barcode create error ", error.message);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

router.post("/scan", async (req, res) => {
  try {
    // console.log("req.file => ", req.file);
    // const { buffer } = req.file;

    // Decode the QR code from the image
    decorder.decode("/home/pc/Downloads/phone_qr.png", (error, response) => {
      console.log("error => ", error);
      console.log("response => ", response);
    });
    // const image = await Jimp.read("/home/pc/Downloads/phone_qr.png");

    // const { data, width, height } = image.bitmap;
    // console.log("data => ", data, width, height);
    // // convert data from buffer to Uint8ClampedArray
    // const imageData = new Uint8ClampedArray(data);
    // const code = jsQR(imageData, width, height, {
    //   inversionAttempts: "dontInvert",
    // });
    // console.log("code => ", code);

    // if (code) {
    //   const qrData = code.data;
    //   console.log("QR Code Data:", qrData);

    //   // Process the QR code data on the backend as needed (e.g., store in the database)
    //   // ...

    //   res.status(200).json({ message: "QR Code Data processed successfully" });
    // } else {
    //   res.status(400).json({ error: "QR Code not detected in the image." });
    // }
    res.status(200).json({ message: "QR Code Data processed successfully" });
  } catch (error) {
    console.log("Scan barcode error ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
