const express = require("express");
const adminRouter = require("./admin.js");
const authRouter = require("./auth.js");
const usersRouter = require("./users.js");
const router = express.Router();
router.use("/admin", adminRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
module.exports = router;
