const { Address } = require('../models');

const getAddressesByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.find({ userId });
    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ nào' });
    }
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, country, isDefault } = req.body;
    const userId = req.user.id;
    console.log('Address model:', Address);
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = new Address({
      userId,
      fullName,
      phone,
      street,
      city,
      state,
      country,
      isDefault: isDefault || false,
    });

    await newAddress.save();

    res.status(201).json(newAddress);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, street, city, state, country, isDefault } = req.body;
    const userId = req.user.id;

    const address = await Address.findOne({ _id: id, userId });
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    if (isDefault === true) {
      await Address.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
    }

    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.country = country || address.country;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await address.save();

    res.json(address);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await Address.findOneAndDelete({ _id: id, userId });
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    res.json({ message: 'Đã xóa địa chỉ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await Address.findOne({ _id: id, userId });
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    await Address.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAddressesByUser,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};