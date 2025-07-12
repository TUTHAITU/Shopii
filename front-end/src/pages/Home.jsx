import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box, 
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Container,
  Paper,
  IconButton
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Lấy thông tin xác thực từ Redux store
  const authState = useSelector(state => state.auth);
  const isAuthenticated = authState?.isAuthenticated || false;
  const user = authState?.user || null;
  const token = authState?.token || null;

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

  // Chỉ kiểm tra khi đã đăng nhập nhưng không phải buyer
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'buyer') {
      navigate('/');
      toast.warning('Bạn không có quyền truy cập trang này');
    }
  }, [isAuthenticated, user, navigate]);

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(response.data.data || []);
    } catch (error) {
      toast.error('Lỗi khi tải danh mục');
      console.error(error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Lấy sản phẩm, có thể lọc theo danh mục
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/products`;
      
      if (selectedCategories.length > 0) {
        const categoryIds = selectedCategories.join(',');
        url += `?categories=${categoryIds}`;
      }
      
      const response = await axios.get(url);
      
      const formattedProducts = response.data.data.map(product => ({
        ...product,
        imageUrl: product.image ? `${API_BASE_URL}/uploads/${product.image}` : 'https://via.placeholder.com/300',
        categoryName: product.categoryId?.name || "Uncategorized",
        sellerName: product.sellerId?.username || "Unknown Seller"
      }));
      
      setProducts(formattedProducts);
    } catch (error) {
      toast.error('Lỗi khi tải sản phẩm');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Khi danh mục được chọn thay đổi, lọc lại sản phẩm
  useEffect(() => {
    fetchProducts();
  }, [selectedCategories]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://via.placeholder.com/300';
  };

  // Xử lý khi chọn/bỏ chọn danh mục
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigate('/signin');
      return;
    }
    
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      const response = await axios.post(
        `${API_BASE_URL}/api/buyers/cart/add`,
        { productId, quantity: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success('Sản phẩm đã được thêm vào giỏ hàng!');
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      toast.error(error.response?.data?.message || 'Thêm vào giỏ hàng thất bại');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading || loadingCategories) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Danh sách sản phẩm
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Bộ lọc</Typography>
            </Box>
            
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Danh mục
            </Typography>
            
            <FormGroup>
              {categories.map(category => (
                <FormControlLabel
                  key={category._id}
                  control={
                    <Checkbox 
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleCategoryChange(category._id)}
                      size="small"
                    />
                  }
                  label={category.name}
                />
              ))}
            </FormGroup>
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={() => setSelectedCategories([])}
            >
              Xóa bộ lọc
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          {selectedCategories.length > 0 && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Đang hiển thị {products.length} sản phẩm trong danh mục đã chọn
            </Typography>
          )}
          
          {products.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Không tìm thấy sản phẩm nào
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setSelectedCategories([])}
              >
                Xem tất cả sản phẩm
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.image}
                      alt={product.title}
                      sx={{ objectFit: 'cover' }}
                      onError={handleImageError}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div" noWrap>
                        {product.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                        {product.categoryName}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {product.description && product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description || 'Không có mô tả'}
                      </Typography>
                      
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        ${product.price.toLocaleString()}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Người bán: {product.sellerName}
                      </Typography>
                    </CardContent>
                    
                    <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => navigate(`/product/${product._id}`)}
                        sx={{
                          backgroundColor: '#e53935',
                          '&:hover': {
                            backgroundColor: '#c62828'
                          }
                        }}
                      >
                        Chi tiết
                      </Button>
                      
                      <IconButton
                        color="primary"
                        aria-label="add to cart"
                        onClick={() => handleAddToCart(product._id)}
                        disabled={!isAuthenticated || addingToCart[product._id]}
                        sx={{
                          backgroundColor: '#f5f5f5',
                          '&:hover': {
                            backgroundColor: '#e0e0e0'
                          }
                        }}
                      >
                        {addingToCart[product._id] ? 
                          <CircularProgress size={24} /> : 
                          <AddShoppingCartIcon />
                        }
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;