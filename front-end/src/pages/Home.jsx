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
  Rating,
  Chip,
  Skeleton,
  Fade,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SortIcon from '@mui/icons-material/Sort';
import { motion } from 'framer-motion';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [sortOrder, setSortOrder] = useState('default');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get authentication info from Redux store
  const authState = useSelector(state => state.auth);
  const isAuthenticated = authState?.isAuthenticated || false;
  const user = authState?.user || null;
  const token = authState?.token || null;

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

  // Remove the block that prevents sellers from accessing the home page
  // Now both sellers and buyers can access the home page
  
  // Check payment status from URL when redirected from PayOS
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentStatus = query.get('paymentStatus');
    
    if (paymentStatus === 'paid') {
      toast.success('Payment successful!');
      // Remove query parameter after displaying the notification
      navigate('/', { replace: true });
    } else if (paymentStatus === 'failed') {
      toast.error('Payment failed!');
      // Remove query parameter after displaying the notification
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Get category list
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(response.data.data || []);
    } catch (error) {
      toast.error('Error loading categories');
      console.error(error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Get products, can filter by category
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/products`;
      
      if (selectedCategories.length > 0) {
        const categoryIds = selectedCategories.join(',');
        url += `?categories=${categoryIds}`;
      }
      
      const response = await axios.get(url);
      
      const formattedProducts = response.data.data.map(product => {
        let imageUrl;
        if (product.image) {
          // If image is a full URL, use it directly
          if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
            imageUrl = product.image;
          } else {
            // Otherwise, concat with API path
            imageUrl = `${API_BASE_URL}/uploads/${product.image}`;
          }
        } else {
          imageUrl = 'https://via.placeholder.com/300';
        }

        return {
          ...product,
          imageUrl,
          categoryName: product.categoryId?.name || "Uncategorized",
          sellerName: product.sellerId?.username || "Unknown Seller"
        };
      });
      
      setProducts(formattedProducts);
    } catch (error) {
      toast.error('Error loading products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // When selected categories change, filter products again
  useEffect(() => {
    fetchProducts();
  }, [selectedCategories]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://via.placeholder.com/300?text=No+Image';
  };

  // Handle when selecting/deselecting categories
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Add product to cart
  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add products to cart');
      navigate('/signin');
      return;
    }
    
    // Find the product to check if it belongs to the seller
    const productToAdd = products.find(p => p._id === productId);
    
    // Prevent seller from adding their own product
    if (user?.role === 'seller' && productToAdd && productToAdd.sellerId?._id === user.id) {
      toast.warning('You cannot add your own products to cart');
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
      
      toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Handle product click to view details
  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`, { state: { item: product } });
    console.log("Navigating to product:", product); // Add logging to debug
  };

  // Handle sort order change
  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  // Sort products based on selected order
  const getSortedProducts = () => {
    if (sortOrder === 'default') {
      return [...products];
    } else if (sortOrder === 'price-asc') {
      return [...products].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      return [...products].sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'name-asc') {
      return [...products].sort((a, b) => {
        const nameA = a.title || '';
        const nameB = b.title || '';
        return nameA.localeCompare(nameB);
      });
    } else if (sortOrder === 'name-desc') {
      return [...products].sort((a, b) => {
        const nameA = a.title || '';
        const nameB = b.title || '';
        return nameB.localeCompare(nameA);
      });
    }
    return [...products];
  };

  // Loading skeleton for products
  const ProductSkeleton = () => (
    <>
      {Array.from(new Array(8)).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Skeleton variant="rectangular" height={200} animation="wave" />
            <CardContent>
              <Skeleton variant="text" height={32} width="80%" animation="wave" />
              <Skeleton variant="text" height={20} width="40%" animation="wave" />
              <Box display="flex" alignItems="center" my={1}>
                <Skeleton variant="text" height={24} width="60%" animation="wave" />
              </Box>
              <Skeleton variant="text" height={20} width="100%" animation="wave" />
              <Skeleton variant="text" height={20} width="100%" animation="wave" />
              <Skeleton variant="text" height={36} width="50%" animation="wave" sx={{ mt: 2 }} />
              <Skeleton variant="rectangular" height={36} width="100%" animation="wave" sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </>
  );

  if (loading || loadingCategories) {
    return (
      <Container maxWidth="lg" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Product List
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterListIcon sx={{ mr: 1 }} />
                <Skeleton variant="text" width={100} animation="wave" />
              </Box>
              
              {Array.from(new Array(5)).map((_, index) => (
                <Skeleton key={index} variant="text" height={30} animation="wave" sx={{ my: 1 }} />
              ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              <ProductSkeleton />
            </Grid>
          </Grid>
        </Grid>
      </Container>
    );
  }

  const sortedProducts = getSortedProducts();

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          borderBottom: '1px solid #e0e0e0',
          pb: 2
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: '#0F52BA',
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '60px',
              height: '4px',
              backgroundColor: '#0F52BA',
              borderRadius: '2px'
            }
          }}
        >
          Discover Products
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                background: 'linear-gradient(to bottom, #ffffff, #f9f9ff)',
                border: '1px solid #eaeaea'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FilterListIcon sx={{ mr: 1, color: '#0F52BA' }} />
                <Typography variant="h6" fontWeight="600">Filters</Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography 
                variant="subtitle1" 
                sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}
              >
                Categories
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
                        sx={{
                          color: '#0F52BA',
                          '&.Mui-checked': {
                            color: '#0F52BA',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {category.name}
                      </Typography>
                    }
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </FormGroup>
              
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ 
                  mt: 3,
                  color: '#0F52BA',
                  borderColor: '#0F52BA',
                  '&:hover': {
                    backgroundColor: 'rgba(15, 82, 186, 0.08)',
                    borderColor: '#0F52BA',
                  }
                }}
                onClick={() => setSelectedCategories([])}
              >
                Clear Filters
              </Button>
            </Paper>

            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                background: 'linear-gradient(to bottom, #ffffff, #f9f9ff)',
                border: '1px solid #eaeaea'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SortIcon sx={{ mr: 1, color: '#0F52BA' }} />
                <Typography variant="h6" fontWeight="600">Sort By</Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={sortOrder === 'default'}
                      onChange={() => handleSortChange('default')}
                      size="small"
                      sx={{
                        color: '#0F52BA',
                        '&.Mui-checked': {
                          color: '#0F52BA',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Default</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={sortOrder === 'price-asc'}
                      onChange={() => handleSortChange('price-asc')}
                      size="small"
                      sx={{
                        color: '#0F52BA',
                        '&.Mui-checked': {
                          color: '#0F52BA',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Price: Low to High</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={sortOrder === 'price-desc'}
                      onChange={() => handleSortChange('price-desc')}
                      size="small"
                      sx={{
                        color: '#0F52BA',
                        '&.Mui-checked': {
                          color: '#0F52BA',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Price: High to Low</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={sortOrder === 'name-asc'}
                      onChange={() => handleSortChange('name-asc')}
                      size="small"
                      sx={{
                        color: '#0F52BA',
                        '&.Mui-checked': {
                          color: '#0F52BA',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Name: A to Z</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={sortOrder === 'name-desc'}
                      onChange={() => handleSortChange('name-desc')}
                      size="small"
                      sx={{
                        color: '#0F52BA',
                        '&.Mui-checked': {
                          color: '#0F52BA',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2">Name: Z to A</Typography>}
                />
              </FormGroup>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} md={9}>
          {selectedCategories.length > 0 && (
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedCategories.map(catId => {
                const category = categories.find(c => c._id === catId);
                return category ? (
                  <Chip 
                    key={catId}
                    label={category.name}
                    onDelete={() => handleCategoryChange(catId)}
                    color="primary"
                    sx={{ 
                      backgroundColor: '#0F52BA',
                      '& .MuiChip-deleteIcon': {
                        color: 'white',
                        '&:hover': {
                          color: '#f0f0f0'
                        }
                      }
                    }}
                  />
                ) : null;
              })}
              
              <Chip 
                label="Clear All"
                onClick={() => setSelectedCategories([])}
                variant="outlined"
                sx={{ 
                  borderColor: '#0F52BA',
                  color: '#0F52BA'
                }}
              />
            </Box>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Showing {sortedProducts.length} products
            </Typography>
          </Box>
          
          {sortedProducts.length === 0 ? (
            <Paper 
              elevation={1} 
              sx={{ 
                textAlign: 'center', 
                p: 6, 
                borderRadius: 2,
                backgroundColor: '#f9f9ff' 
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: '#666' }}>
                No products found
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setSelectedCategories([])}
                sx={{ 
                  backgroundColor: '#0F52BA',
                  '&:hover': {
                    backgroundColor: '#0A3C8A',
                  },
                }}
              >
                View all products
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {sortedProducts.map((product, index) => (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <Fade in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <Box sx={{ 
                        position: 'relative',
                        height: '220px',
                        overflow: 'hidden',
                        backgroundColor: '#f9f9f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CardMedia
                          component="img"
                          sx={{
                            height: '180px',
                            width: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.5s ease',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                          image={product.imageUrl || 'https://via.placeholder.com/300?text=No+Image'}
                          alt={product.title || "Product Image"}
                          onError={handleImageError}
                        />
                        
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          p: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5
                        }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                backgroundColor: 'white', 
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                '&:hover': {
                                  backgroundColor: '#0F52BA',
                                  color: 'white'
                                }
                              }}
                              onClick={() => handleProductClick(product)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Box sx={{ mb: 1 }}>
                          <Chip 
                            label={product.categoryName} 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(15, 82, 186, 0.1)', 
                              color: '#0F52BA',
                              fontWeight: 500,
                              fontSize: '0.7rem'
                            }} 
                          />
                        </Box>
                        
                        <Typography 
                          gutterBottom 
                          variant="h6" 
                          component="div" 
                          fontWeight="600"
                          sx={{ 
                            fontSize: '1.1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            height: '3.3em',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleProductClick(product)}
                        >
                          {product.title || "Untitled Product"}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" mb={1}>
                          <Rating value={4.5} readOnly size="small" precision={0.5} />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            (4.5)
                          </Typography>
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            height: '3em'
                          }}
                        >
                          {product.description || 'No description available'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight="700" 
                            color="#0F52BA" 
                          >
                            ${product.price?.toFixed(2)}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            By {product.sellerName}
                          </Typography>
                        </Box>
                        
                        <Button 
                          variant="contained"
                          fullWidth
                          startIcon={<AddShoppingCartIcon />}
                          onClick={() => handleAddToCart(product._id)}
                          disabled={addingToCart[product._id]}
                          sx={{ 
                            backgroundColor: '#0F52BA', 
                            '&:hover': {
                              backgroundColor: '#0A3C8A',
                            },
                            textTransform: 'none',
                            fontWeight: 'bold',
                            py: 1.2
                          }}
                        >
                          {addingToCart[product._id] ? 'Adding...' : 'Add to Cart'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Fade>
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