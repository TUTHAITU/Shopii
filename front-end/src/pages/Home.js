import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API call to /api/products
  useEffect(() => {
    const mockProducts = [
      {
        id: 1,
        title: 'iPhone 13 Pro Max',
        description: 'Mới 100%, chính hãng Apple Việt Nam',
        price: 25000000,
        image: null
      },
      {
        id: 2,
        title: 'MacBook Pro M1 2023',
        description: 'Laptop 14 inch, RAM 16GB, SSD 512GB',
        price: 35000000,
        image: null
      },
      {
        id: 3,
        title: 'AirPods Pro 2',
        description: 'Tai nghe không dây chống ồn chủ động',
        price: 5500000,
        image: null
      },
      {
        id: 4,
        title: 'Apple Watch Series 8',
        description: 'Đồng hồ thông minh theo dõi sức khỏe',
        price: 12000000,
        image: null
      },
      {
        id: 5,
        title: 'iPad Pro M2 11 inch',
        description: 'Máy tính bảng hiệu năng cao',
        price: 22000000,
        image: null
      },
      {
        id: 6,
        title: 'Samsung Galaxy S23 Ultra',
        description: 'Flagship Android 2023',
        price: 27000000,
        image: null
      }
    ];
    
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Sản phẩm nổi bật</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;