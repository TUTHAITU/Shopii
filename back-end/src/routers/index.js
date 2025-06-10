const express = require("express");
const adminRouter = require("./admin");
const sellerRouter = require("./seller");
const router = express.Router();

router.use("/admin", adminRouter);
router.use("/seller", sellerRouter);

module.exports = router;