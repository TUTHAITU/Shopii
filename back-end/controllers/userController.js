const jwt = require("jsonwebtoken");
const { User } = require("../models");
const logger = require("../utils/logger");

// Hàm xử lý lỗi
const handleError = (res, error, message = "Lỗi Máy Chủ", statusCode = 500) => {
  logger.error(`${message}: `, error);
  res
    .status(statusCode)
    .json({ success: false, message, error: error.message });
};

// Đăng ký người dùng
exports.registerUser = async (req, res) => {
  const { username, email, password, role, fullname, avatarURL } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp username, email và password",
    });
  }

  try {
    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã được sử dụng",
      });
    }

    // Tạo người dùng mới, để middleware xử lý mã hóa mật khẩu
    const user = await User.create({
      username,
      email,
      password, // Truyền mật khẩu thô, middleware pre('save') sẽ mã hóa
      role:
        role && ["buyer", "seller", "admin"].includes(role) ? role : "buyer",
      fullname: fullname || "",
      avatarURL: avatarURL || "",
      action: "unlock",
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: { username: user.username, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return handleError(
        res,
        error,
        "Email hoặc username đã được sử dụng",
        400
      );
    }
    handleError(res, error, "Lỗi khi đăng ký người dùng");
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const emailLower = email.toLowerCase();

  console.log("Login attempt:", {
    email: emailLower,
    password: password ? "[provided]" : "[missing]",
  });

  if (!emailLower || !password) {
    console.log("Missing email or password:", { email: emailLower, password });
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng cung cấp email và password" });
  }

  try {
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      console.log(`No user found for email: ${emailLower}`);
      return res
        .status(401)
        .json({ success: false, message: "Email hoặc password không đúng" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Password mismatch for email: ${emailLower}`);
      return res
        .status(401)
        .json({ success: false, message: "Email hoặc password không đúng" });
    }

    if (user.action === "lock") {
      console.log(`Account locked for email: ${emailLower}`);
      return res
        .status(403)
        .json({ success: false, message: "Tài khoản của bạn đã bị khóa" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userToReturn = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      action: user.action,
    };

    console.log(`Login successful for email: ${emailLower}`, {
      userId: user._id,
      role: user.role,
    });
    res.status(200).json({ success: true, token, user: userToReturn });
  } catch (error) {
    console.error("Login error:", error);
    handleError(res, error, "Lỗi khi đăng nhập");
  }
};

// Lấy thông tin người dùng
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy thông tin người dùng");
  }
};
