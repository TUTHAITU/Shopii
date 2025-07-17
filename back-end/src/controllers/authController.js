const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { sendEmail } = require("../services/emailService");

// Hàm kiểm tra định dạng email
const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Hàm tạo mật khẩu ngẫu nhiên
const generatePassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, fullname, email, password, role } = req.body;

    // Kiểm tra đầu vào
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email và password là bắt buộc" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Định dạng email không hợp lệ" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải dài ít nhất 6 ký tự" });
    }
    if (role && !["buyer", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
    }

    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username hoặc email đã tồn tại" });
    }

    // Tạo người dùng mới
    const user = new User({
      username,
      fullname,
      email,
      password, // Sẽ được mã hóa bởi hook pre-save
      role: role || "buyer",
    });

    await user.save();

    // Gửi email chào mừng
    try {
      await sendEmail(user.email, "Welcome to Shopii", "Thank you for registering with us!");
    } catch (emailError) {
      logger.error("Failed to send welcome email:", emailError);
    }

    res.status(201).json({ success: true, message: "Đăng ký thành công" });
  } catch (error) {
    logger.error("Lỗi đăng ký:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email và password là bắt buộc" });
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Lỗi đăng nhập:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email là bắt buộc" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const newPassword = generatePassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu mà không kích hoạt hook pre-save
    await User.updateOne({ _id: user._id }, { password: hashedPassword });

    // Gửi email với mật khẩu mới
    await sendEmail(user.email, "Mật khẩu mới của bạn", `Mật khẩu mới của bạn là: ${newPassword}`);

    res.json({ success: true, message: "Mật khẩu mới đã được gửi tới email của bạn" });
  } catch (error) {
    logger.error("Lỗi trong forgotPassword:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thay đổi vai trò người dùng
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực

    // Kiểm tra đầu vào
    if (!role) {
      return res.status(400).json({ success: false, message: "Vai trò mới là bắt buộc" });
    }
    if (!["buyer", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
    }

    // Tìm và cập nhật người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Cập nhật vai trò
    user.role = role;
    await user.save();

    // Tạo JWT token mới với vai trò đã cập nhật
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: `Vai trò đã được cập nhật thành ${role}`,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Lỗi thay đổi vai trò:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};