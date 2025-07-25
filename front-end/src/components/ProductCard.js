import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48" />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{product.title}</h3>
        <p className="text-gray-500 text-sm mb-2 line-clamp-2 h-10">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-indigo-600">{product.price.toLocaleString()} VND</span>
          <button className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm hover:bg-indigo-200">
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;