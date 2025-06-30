const express = require("express");
const router = express.Router();
const { getUserProfile } = require("../controllers/userController");
const { authMiddleware } = require("../middleware/auth.middleware");

router.get("/profile", authMiddleware, getUserProfile);

module.exports = router;
