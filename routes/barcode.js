import express from "express";
import Barcode from "../db/models/Barcode.js";
import {
  assignLink,
  bulkBarcodeCreateSchema,
  schema,
} from "../config/validation-schema.js";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../config/response.js";
import multer from "multer";
import { readBarcodesFromImageFile } from "zxing-wasm";
import upload from "../utils/uploadToS3.js";
import { verifyAdmin, verifyUser } from "../middleware/auth.js";
import User from "../db/models/User.js";
import ObjectsToCsv from "objects-to-csv";

const router = express.Router();

// Generate barcode links in bulk
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
    const csv = await new ObjectsToCsv(
      barCodes.map((barcode) => ({ link: barcode.link }))
    ).toString();
    res.status(STATUS_CODES.CREATED).json({
      message: RESPONSE_MESSAGES.created("Barcodes"),
      barCodes,
      barcodeCSV: csv,
    });
  } catch (error) {
    console.log("Bulk barcode create error ", error.message);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Get barcode list
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const query = req.query;
    const limit = query.limit || 10;
    const skip = query.skip || 0;

    const filter = {};
    if (query.disabled) {
      filter.isActive = false;
    }
    if (query.link) {
      filter.link = query.link;
    }
    if (query.approved) {
      filter.approved = query.approved === "true" ? true : false;
      // filter.approvedDate = query.approved === "true" ? new Date : null;
    }
    if (query.isActive) {
      filter.isActive = query.isActive === "true" ? true : false;
    }
    if (query?.startDate) {
      const startDate = new Date(query?.startDate);
      const endDate = query?.endDate ? new Date(query?.endDate) : new Date;
      filter.imageUploadDate = {
        $exists: true,
        $gte: startDate,
        $lte: endDate?.setHours(23, 59, 59),
      };
    }

    const barCodes = await Barcode.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).populate('user').lean();

    // Get count of total barcode
    const totalBarcodes = await Barcode.countDocuments(filter);

    res.status(STATUS_CODES.SUCCESS).json({ barCodes, total: totalBarcodes });
  } catch (error) {
    console.log("Error while fetching barcodes", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Get barcode list of one user
router.get("/user/:id", verifyUser, async (req, res) => {
  try {
    const id = req.params.id;
    const barcodes = await Barcode.find({
      user: id,
      isActive: true,
      approved: true,
    }).lean();
    if (!barcodes) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode List") });
    }
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.success("Barcode List"), barcodes });
  } catch (error) {
    console.log("Error while getting barcode list", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Scanned barcode
router.get("/scanned/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const barcode = await Barcode.findById(id).lean();
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }

    const scanCount = (barcode.scanCount || 0) + 1;
    await Barcode.findByIdAndUpdate(id, { scanCount }).lean();

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.success("Barcode Scanned"), barcode });
  } catch (error) {
    console.log("Error while scanned count plus barcode", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Get barcode
router.get("/qrcode/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const barcode = await Barcode.findById(id).lean();
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.success("Barcode"), barcode });
  } catch (error) {
    console.log("Error while getting barcode", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Delete barcode
router.delete("/:id",verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const barcode = await Barcode.findByIdAndDelete(id).lean();
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.deleted("Barcode") });
  } catch (error) {
    console.log("Error while deleting barcode", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Update barcode info
router.put("/:id", verifyUser, multer().single("file"), async (req, res) => {
  try {
    const id = req.params.id;

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }
    let barcode = await Barcode.findById(id); // Retrieve barcode by ID

    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }

    if (["image", "pdf"].includes(value.type) && req.file && req.file.buffer) {
      const file = req.file;
      const imageOrPdfUrl = await upload(
        file?.buffer,
        `/${id}/${file?.originalname}`,
        file?.mimetype
      );
      if (!imageOrPdfUrl) {
        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
      }
      barcode.storedInfo = {
        infoType: value.type,
        link: imageOrPdfUrl,
      };
    } else if (value.type === "link") {
      barcode.storedInfo = {
        infoType: "link",
        link: value.link,
      };
    } else if (value.type === "phoneNumber") {
      barcode.storedInfo = {
        infoType: "phoneNumber",
        link: value.phoneNumber,
      };
    }

    if (value.name) {
      barcode.name = value.name;
    }
    await barcode.save(); // Save updated barcode

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.updated("Barcode"), barcode });
  } catch (error) {
    console.log("Error while updating barcode", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Get barcode by link
router.get("/:link", async (req, res) => {
  try {
    const { link } = req.params;
    const searchLink = new RegExp(link, "i");

    const barcode = await Barcode.findOne({ link: searchLink })
      .populate("user")
      .lean();
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }
    return res.status(STATUS_CODES.SUCCESS).json({ barcode });
  } catch (error) {
    console.log("Error while fetching barcode", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Enable or disable barcode
router.get("/:id/:mode", verifyAdmin, async (req, res) => {
  try {
    const { id, mode } = req.params;
    const AVAILABLE_MODES = ["enable", "disable"];
    if (AVAILABLE_MODES.indexOf(mode) === -1) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: RESPONSE_MESSAGES.BAD_REQUEST });
    }
    const barcode = await Barcode.findById(id);
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }
    barcode.isActive = mode === "enable";
    await barcode.save();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.updated("Barcode"), barcode });
  } catch (error) {
    console.log("Error while enabling/disabling barcode", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Approve barcode
router.put("/:id/approve", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const barcode = await Barcode.findById(id);
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }
    if (barcode.approved) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: RESPONSE_MESSAGES.BARCODE_ALREADY_APPROVED });
    }
    barcode.approved = true;
    barcode.approvedDate = new Date;
    await barcode.save();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.updated("Barcode"), barcode });
  } catch (error) {
    console.log("Error while approving barcode", error.message);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Upload barcode images and link it to the respective records
router.post("/upload", verifyAdmin, multer().any(), async (req, res) => {
  try {
    const readOption = {
      tryHarder: true,
      formats: ["QRCode"],
      maxNumberOfSymbols: 1,
    };

    const barCodes = [];

    // Process the uploaded images and read the QR codes and link them to the respective records
    const { files } = req;
    for await (const file of files) {
      const arrayBufferView = new Blob([new Uint8Array(file.buffer)], {
        type: "application/octet-stream",
      });
      const imageData = await readBarcodesFromImageFile(
        arrayBufferView,
        readOption
      );

      if (imageData.length) {
        const link = imageData[0].text;
        const barcode = await Barcode.findOne({ link });
        if (barcode && !barcode.imageLink) {
          barCodes.push({ barcode, file });
        }
      }
    }
    console.log("scanned QR codes");

    // Upload the images to S3 and save the records
    const uploadAndSave = async (barcode, file) => {
      const url = await upload(file.buffer, file.originalname, file.mimetype);
      barcode.imageLink = url;
      barcode.imageUploadDate = new Date;
      await barcode.save();
    };
    if (barCodes.length === 0) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "No valid QR codes found in the images" });
    }
    // Upload and save 5 barcodes at a time
    for (let i = 0; i < barCodes.length; i += 5) {
      const batch = barCodes.slice(i, i + 5);
      await Promise.all(
        batch.map(async ({ barcode, file }) => {
          await uploadAndSave(barcode, file);
        })
      );
    }
    console.log("uploaded barcode images to s3");
    res.status(200).json({ message: "QR codes uploaded successfully" });
  } catch (error) {
    console.log("Error while scanning and uploading barCodes", error);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Assign user to barcode
router.post("/assign/user", verifyUser, async (req, res) => {
  try {
    const { value, error } = assignLink.validate(req.body);

    if (error) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: error.message });
    }

    const user = await User.findById(value.user);
    if (!user) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("User") });
    }
    const barcode = await Barcode.findById(value.link);
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("QR Code") });
    }

    if (barcode.user || !barcode.approved || !barcode.isActive) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: RESPONSE_MESSAGES.BAD_REQUEST });
    }

    barcode.user = user._id;
    await barcode.save();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: RESPONSE_MESSAGES.updated("QR Code") });
  } catch (error) {
    console.log("Error while assigning user to link");
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// Upload barcode image to the specific barcode and link it to the specific record
router.post("/upload/:id", verifyAdmin, multer().single('image'), async (req, res) => {
  try {
    // get the file and id from the request
    const file  = req.file;
    const id = req.params.id;

    if (!file) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "No QR image found" });
    }

    // Upload the image to S3 and save the record
    let barcode = await Barcode.findById(id);
    if (!barcode) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: RESPONSE_MESSAGES.not_found("Barcode") });
    }

    const url = await upload(file.buffer, file.originalname, file.mimetype);
    if (url) {
      barcode.imageLink = url;
      barcode.imageUploadDate = new Date;
      await barcode.save();

      console.log("uploaded barcode image to s3");
      return res.status(200).json({ message: "QR code uploaded successfully" });
    }

    console.log("error in uploading barcode image to s3");
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  } catch (error) {
    console.log("Error while uploading barCode", error);
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});


export default router;
