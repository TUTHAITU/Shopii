import React from 'react';

function CartItem({ item, onUpdateCart, cartItems }) {
  const [quantity, setQuantity] = React.useState(item.quantity);

  const handleIncrease = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    const updatedItems = cartItems.map((i) =>
      i.productId._id === item.productId._id ? { ...i, quantity: newQuantity } : i
    );
    onUpdateCart(updatedItems);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      const updatedItems = cartItems.map((i) =>
        i.productId._id === item.productId._id ? { ...i, quantity: newQuantity } : i
      );
      onUpdateCart(updatedItems);
    }
  };

  const handleRemove = () => {
    const updatedItems = cartItems.filter((i) => i.productId._id !== item.productId._id);
    onUpdateCart(updatedItems);
  };

  return (
    <div className="flex items-center py-4 border-b border-gray-200">
      <img
        src={item.productId.imageUrl || 'https://via.placeholder.com/100'}
        alt={item.productId.title}
        className="w-24 h-24 object-cover mr-4"
      />
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-800">{item.productId.title}</h3>
        <p className="text-gray-500">{item.productId.color}, {item.productId.size}</p>
        <p className={item.productId.stock > 0 ? 'text-green-600' : 'text-red-600'}>
          {item.productId.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </p>
        <div className="flex items-center mt-2">
          <button onClick={handleDecrease} className="px-2 py-1 bg-gray-200 rounded">-</button>
          <span className="mx-2">{quantity}</span>
          <button onClick={handleIncrease} className="px-2 py-1 bg-gray-200 rounded">+</button>
        </div>
        <button onClick={handleRemove} className="text-red-500 mt-2">Remove</button>
      </div>
      <p className="text-lg font-bold text-gray-800">${item.productId.price}</p>
    </div>
  );
}

export default CartItem;