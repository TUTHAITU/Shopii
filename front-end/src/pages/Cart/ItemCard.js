import React from "react";
import { ImCross } from "react-icons/im";

const ItemCard = ({ 
  item, 
  isSelected, 
  onSelect, 
  onUpdateQuantity, 
  onRemoveItem 
}) => {
  if (!item) return null;

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item._id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item._id, item.quantity + 1);
  };

  return (
    <div className="w-full grid grid-cols-6 mb-4 border py-2">
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4"
        />
      </div>
      <div className="flex col-span-2 items-center gap-4">
        <ImCross
          onClick={() => onRemoveItem(item._id)}
          className="text-primeColor hover:text-red-500 duration-300 cursor-pointer"
        />
        <img 
          className="w-24 h-24 object-contain" 
          src={item.image} 
          alt={item.name || "Product"} 
        />
        <h1 className="font-titleFont font-semibold text-sm">
          {item.title || "Product Name"}
        </h1>
      </div>
      <div className="flex items-center justify-center text-lg font-semibold">
        ${item.price?.toFixed(2) || "0.00"}
      </div>
      <div className="flex items-center justify-center gap-2 text-lg">
        <span
          onClick={handleDecrease}
          className="w-6 h-6 bg-gray-100 text-2xl flex items-center justify-center hover:bg-gray-300 cursor-pointer duration-300 border-[1px] border-gray-300 hover:border-gray-300"
        >
          -
        </span>
        <p>{item.quantity}</p>
        <span
          onClick={handleIncrease}
          className="w-6 h-6 bg-gray-100 text-2xl flex items-center justify-center hover:bg-gray-300 cursor-pointer duration-300 border-[1px] border-gray-300 hover:border-gray-300"
        >
          +
        </span>
      </div>
      <div className="flex items-center justify-center font-titleFont font-bold text-lg">
        <p>${(item.quantity * (item.price || 0)).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ItemCard;