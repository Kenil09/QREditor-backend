// express setup
import express from "express";
import connect from "./db/connect.js";
import cors from "cors";
import userRoute from "./routes/user.js";
import barcodeRoute from "./routes/barcode.js";
import passportSetup from './utils/passport.js';
import "dotenv/config";

const app = express();

connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
passportSetup(app);

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/user", userRoute);
app.use("/barcode", barcodeRoute);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

app._router.stack.forEach(function (r) {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

export default app;
