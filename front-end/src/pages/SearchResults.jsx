import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Container,
  Rating,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Fade,
  Drawer,
  Slider,
  Pagination,
  FormGroup,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');
  const [addingToCart, setAddingToCart] = useState({});
  const [favoriteProducts, setFavoriteProducts] = useState({});
  
  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minMaxPrice, setMinMaxPrice] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Get authentication info from Redux store
  const authState = useSelector(state => state.auth);
  const isAuthenticated = authState?.isAuthenticated || false;
  const user = authState?.user || null;
  const token = authState?.token || null;

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

  useEffect(() => {
    // Extract search query from URL parameters
    const query = new URLSearchParams(location.search);
    const q = query.get('q');
    
    if (q) {
      setSearchQuery(q);
      searchProducts(q);
    }
  }, [location.search]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      searchProducts(searchQuery);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const searchProducts = async (query) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`);
      
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
          sellerName: product.sellerId?.username || "Unknown Seller",
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0
        };
      });
      
      setProducts(formattedProducts);
      
      // Extract available categories and set price range
      const categories = [...new Set(formattedProducts.map(p => p.categoryName))];
      setAvailableCategories(categories);
      
      // Calculate min and max prices
      if (formattedProducts.length > 0) {
        const prices = formattedProducts.map(p => p.price || 0);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        setMinMaxPrice([minPrice, maxPrice]);
        setPriceRange([minPrice, maxPrice]);
      }
      
      // Reset pagination
      setPage(1);
    } catch (error) {
      toast.error('Error searching products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://via.placeholder.com/300?text=No+Image';
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

  // Toggle favorite product
  const handleToggleFavorite = (productId) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to favorite products');
      return;
    }
    
    setFavoriteProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    
    // This is just for demonstration - normally would call an API
    if (!favoriteProducts[productId]) {
      toast.success('Added to favorites!');
    } else {
      toast.info('Removed from favorites');
    }
  };

  // Handle product click to view details
  const handleProductClick = (product) => {
    navigate(`/auth/product/${product._id}`, { state: { item: product } });
  };

  // Handle sort order change
  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
    setPage(1);
  };
  
  // Handle price range change
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
    setPage(1);
  };
  
  // Handle rating filter change
  const handleRatingChange = (rating) => {
    setRatingFilter(rating === ratingFilter ? 0 : rating);
    setPage(1);
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    setPriceRange(minMaxPrice);
    setSelectedCategories([]);
    setRatingFilter(0);
    setPage(1);
  };
  
  // Toggle filter drawer
  const toggleFilterDrawer = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };

  // Filter products
  const getFilteredProducts = () => {
    return products.filter(product => {
      // Price filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.categoryName)) {
        return false;
      }
      
      // Rating filter
      if (ratingFilter > 0 && product.rating < ratingFilter) {
        return false;
      }
      
      return true;
    });
  };

  // Sort products based on selected order
  const getSortedProducts = () => {
    const filtered = getFilteredProducts();
    
    if (sortOrder === 'default') {
      return [...filtered];
    } else if (sortOrder === 'price-asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'name-asc') {
      return [...filtered].sort((a, b) => {
        const nameA = a.title || '';
        const nameB = b.title || '';
        return nameA.localeCompare(nameB);
      });
    } else if (sortOrder === 'name-desc') {
      return [...filtered].sort((a, b) => {
        const nameA = a.title || '';
        const nameB = b.title || '';
        return nameB.localeCompare(nameA);
      });
    } else if (sortOrder === 'rating-desc') {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    }
    return [...filtered];
  };

  // Get paginated products
  const getPaginatedProducts = () => {
    const sorted = getSortedProducts();
    const startIndex = (page - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedProducts = getPaginatedProducts();
  const totalProducts = getSortedProducts().length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // Filter drawer content
  const filterDrawerContent = (
    <Box sx={{ width: isMobile ? '100vw' : 300, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>Filters</Typography>
        <IconButton onClick={toggleFilterDrawer}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Price Range</Typography>
      <Box sx={{ px: 1, mb: 4 }}>
        <Slider
          value={priceRange}
          onChange={handlePriceRangeChange}
          valueLabelDisplay="auto"
          min={minMaxPrice[0]}
          max={minMaxPrice[1]}
          sx={{
            color: '#0F52BA',
            '& .MuiSlider-thumb': {
              '&:focus, &:hover, &.Mui-active': {
                boxShadow: '0 0 0 8px rgba(15, 82, 186, 0.16)',
              },
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2">${priceRange[0]}</Typography>
          <Typography variant="body2">${priceRange[1]}</Typography>
        </Box>
      </Box>
      
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Categories</Typography>
      <FormGroup sx={{ mb: 4 }}>
        {availableCategories.map((category) => (
          <FormControlLabel
            key={category}
            control={
              <Checkbox 
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                sx={{
                  color: '#0F52BA',
                  '&.Mui-checked': {
                    color: '#0F52BA',
                  },
                }}
              />
            }
            label={category}
          />
        ))}
      </FormGroup>
      
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Minimum Rating</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
        {[4, 3, 2, 1].map((rating) => (
          <Box 
            key={rating}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 1,
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: ratingFilter === rating ? 'rgba(15, 82, 186, 0.08)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(15, 82, 186, 0.04)'
              }
            }}
            onClick={() => handleRatingChange(rating)}
          >
            <Rating value={rating} readOnly size="small" precision={1} />
            <Typography variant="body2" sx={{ ml: 1 }}>& Up</Typography>
          </Box>
        ))}
      </Box>
      
      <Button 
        variant="outlined" 
        fullWidth 
        onClick={handleResetFilters}
        sx={{
          color: '#0F52BA',
          borderColor: '#0F52BA',
          '&:hover': {
            borderColor: '#0A3C8A',
            backgroundColor: 'rgba(15, 82, 186, 0.04)',
          },
        }}
      >
        Reset Filters
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              background: 'linear-gradient(45deg, #0F52BA, #5E91F5)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Search Results
          </Typography>
          
          <Box sx={{ width: { xs: '100%', sm: '60%', md: '50%' } }}>
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search products..."
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Box>
        </Box>
      </motion.div>

      <Divider sx={{ mb: 4 }} />
      
      {/* Sort and Filter Controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" color="text.secondary">
            {loading ? 'Searching...' : `Found ${totalProducts} results for "${searchQuery}"`}
          </Typography>
          
          {totalProducts > 0 && !loading && (
            <Chip 
              label={`${selectedCategories.length > 0 || priceRange[0] > minMaxPrice[0] || priceRange[1] < minMaxPrice[1] || ratingFilter > 0 ? 'Filtered' : 'All Results'}`}
              size="small"
              sx={{ 
                backgroundColor: selectedCategories.length > 0 || priceRange[0] > minMaxPrice[0] || priceRange[1] < minMaxPrice[1] || ratingFilter > 0 ? 'rgba(15, 82, 186, 0.08)' : 'transparent',
                color: '#0F52BA',
              }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={toggleFilterDrawer}
            size={isMobile ? "small" : "medium"}
            sx={{
              color: '#0F52BA',
              borderColor: '#0F52BA',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#0A3C8A',
                backgroundColor: 'rgba(15, 82, 186, 0.04)',
              },
            }}
          >
            Filter
          </Button>
          
          <FormControl variant="outlined" size={isMobile ? "small" : "medium"} sx={{ minWidth: 150 }}>
            <Select
              value={sortOrder}
              onChange={handleSortChange}
              displayEmpty
              startAdornment={<SortIcon sx={{ mr: 1, color: '#0F52BA' }} />}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="default">Default Sort</MenuItem>
              <MenuItem value="price-asc">Price: Low to High</MenuItem>
              <MenuItem value="price-desc">Price: High to Low</MenuItem>
              <MenuItem value="name-asc">Name: A to Z</MenuItem>
              <MenuItem value="name-desc">Name: Z to A</MenuItem>
              <MenuItem value="rating-desc">Highest Rated</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* Active Filter Chips */}
      {(selectedCategories.length > 0 || priceRange[0] > minMaxPrice[0] || priceRange[1] < minMaxPrice[1] || ratingFilter > 0) && !loading && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {selectedCategories.map(category => (
            <Chip 
              key={category}
              label={category}
              onDelete={() => handleCategoryChange(category)}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(15, 82, 186, 0.08)', 
                color: '#0F52BA',
              }}
            />
          ))}
          
          {(priceRange[0] > minMaxPrice[0] || priceRange[1] < minMaxPrice[1]) && (
            <Chip 
              label={`$${priceRange[0]} - $${priceRange[1]}`}
              onDelete={() => setPriceRange(minMaxPrice)}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(15, 82, 186, 0.08)', 
                color: '#0F52BA',
              }}
            />
          )}
          
          {ratingFilter > 0 && (
            <Chip 
              label={`${ratingFilter}★ & Up`}
              onDelete={() => setRatingFilter(0)}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(15, 82, 186, 0.08)', 
                color: '#0F52BA',
              }}
            />
          )}
          
          <Chip 
            label="Clear All"
            onClick={handleResetFilters}
            size="small"
            sx={{ 
              backgroundColor: 'rgba(255, 61, 113, 0.08)', 
              color: '#ff3d71',
            }}
          />
        </Box>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress sx={{ color: '#0F52BA' }} />
        </Box>
      )}
      
      {/* No Results Message */}
      {!loading && totalProducts === 0 && (
        <Fade in={!loading}>
          <Paper 
            elevation={2} 
            sx={{ 
              textAlign: 'center', 
              p: 8, 
              borderRadius: 3,
              backgroundColor: '#f9f9ff',
              border: '1px dashed rgba(15, 82, 186, 0.3)'
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, color: '#555', fontWeight: 600 }}>
              No products match your search criteria
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              sx={{ 
                backgroundColor: '#0F52BA',
                borderRadius: 2,
                px: 4,
                py: 1.2,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#0A3C8A',
                },
              }}
            >
              Browse all products
            </Button>
          </Paper>
        </Fade>
      )}
      
      {/* Search Results Grid */}
      {!loading && displayedProducts.length > 0 && (
        <Grid container spacing={3}>
          {displayedProducts.map((product, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.08, 
                  ease: [0.25, 0.1, 0.25, 1.0] 
                }}
              >
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 16px 30px rgba(15, 82, 186, 0.15)'
                  }
                }}>
                  {product.rating >= 4.5 && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 12, 
                      left: 12, 
                      zIndex: 2,
                      backgroundColor: '#0F52BA',
                      color: 'white',
                      borderRadius: 6,
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      boxShadow: '0 4px 8px rgba(15, 82, 186, 0.3)'
                    }}>
                      Top Rated
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    position: 'relative',
                    height: '200px',
                    overflow: 'hidden',
                    backgroundColor: '#f7f9ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2
                  }}>
                    <CardMedia
                      component="img"
                      sx={{
                        height: '160px',
                        width: '100%',
                        objectFit: 'contain',
                        transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                        '&:hover': {
                          transform: 'scale(1.08)'
                        }
                      }}
                      image={product.imageUrl || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={product.title || "Product Image"}
                      onError={handleImageError}
                      onClick={() => handleProductClick(product)}
                    />
                    
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 12, 
                      right: 12, 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      <IconButton 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'white', 
                          boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                          '&:hover': {
                            backgroundColor: '#0F52BA',
                            color: 'white'
                          }
                        }}
                        onClick={() => handleProductClick(product)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'white', 
                          boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                          color: favoriteProducts[product._id] ? '#ff3d71' : 'inherit',
                          '&:hover': {
                            backgroundColor: favoriteProducts[product._id] ? '#fff0f3' : '#fff5f7',
                            color: '#ff3d71'
                          }
                        }}
                        onClick={() => handleToggleFavorite(product._id)}
                      >
                        {favoriteProducts[product._id] ? 
                          <FavoriteIcon fontSize="small" /> : 
                          <FavoriteBorderIcon fontSize="small" />
                        }
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 2.5, pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={product.categoryName} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(15, 82, 186, 0.08)', 
                          color: '#0F52BA',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          borderRadius: 6,
                          height: 22,
                        }} 
                      />
                      
                      <Box display="flex" alignItems="center">
                        <Rating 
                          value={product.rating || 0} 
                          readOnly 
                          size="small" 
                          precision={0.5} 
                        />
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      component="div" 
                      fontWeight="700"
                      sx={{ 
                        fontSize: '1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        height: '2.5em',
                        cursor: 'pointer',
                        mb: 1
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      {product.title || "Untitled Product"}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 2, 
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Seller: {product.sellerName}</span>
                      <span>({product.reviewCount || 0})</span>
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="700" sx={{ color: '#0F52BA' }}>
                        ${product.price?.toFixed(2)}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={() => handleAddToCart(product._id)}
                        disabled={addingToCart[product._id]}
                        sx={{ 
                          backgroundColor: '#0F52BA',
                          '&:hover': {
                            backgroundColor: '#0A3C8A',
                          }
                        }}
                      >
                        {addingToCart[product._id] ? 'Adding...' : 'Add'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary"
            size={isMobile ? "small" : "medium"}
            showFirstButton 
            showLastButton
            siblingCount={isTablet ? 0 : 1}
          />
        </Box>
      )}
      
      {/* Filter Drawer */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={toggleFilterDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 300,
            boxSizing: 'border-box',
          },
        }}
      >
        {filterDrawerContent}
      </Drawer>
    </Container>
  );
};

export default SearchResults; 