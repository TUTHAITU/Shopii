import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../features/address/addressSlice';

const Address = () => {
  const dispatch = useDispatch();
  const addresses = useSelector((state) => state.address.addresses);
  const [showForm, setShowForm] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleAddAddress = (address) => {
    dispatch(addAddress(address));
    setShowForm(false);
  };

  const handleUpdateAddress = (address) => {
    dispatch(updateAddress(address));
    setCurrentAddress(null);
  };

  const handleDeleteAddress = (id) => {
    dispatch(deleteAddress(id));
  };

  const handleSetDefault = (id) => {
    dispatch(setDefaultAddress(id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Addresses</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowForm(true)}
      >
        Add New Address
      </button>
      {showForm && (
        <AddressForm
          onSubmit={handleAddAddress}
          onCancel={() => setShowForm(false)}
        />
      )}
      <div className="space-y-4">
        {addresses.map((address) => (
          <div key={address._id} className="border p-4 rounded shadow">
            <p className="font-semibold">{address.fullName}</p>
            <p>{address.phone}</p>
            <p>{address.street}, {address.city}, {address.state}, {address.country}</p>
            {address.isDefault && <p className="text-green-500">Default Address</p>}
            <div className="mt-2 space-x-2">
              <button
                className="bg-yellow-500 text-white px-3 py-1 rounded"
                onClick={() => setCurrentAddress(address)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => handleDeleteAddress(address._id)}
              >
                Delete
              </button>
              {!address.isDefault && (
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded"
                  onClick={() => handleSetDefault(address._id)}
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {currentAddress && (
        <AddressForm
          address={currentAddress}
          onSubmit={handleUpdateAddress}
          onCancel={() => setCurrentAddress(null)}
        />
      )}
    </div>
  );
};

const AddressForm = ({ address, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(address || {
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    isDefault: false,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const validatePhoneNumber = (phone) => {
    const regex = /^0\d{9}$/;
    return regex.test(phone);
  };

  const handleSubmit = () => {
    if (!validatePhoneNumber(formData.phone)) {
      setError('Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và chứa đúng 10 chữ số.');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{address ? 'Edit Address' : 'Add Address'}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="space-y-4">
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder="Street"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Country"
            className="w-full p-2 border rounded"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleCheckboxChange}
            />
            <span>Set as Default</span>
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Address;