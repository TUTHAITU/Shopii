import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import { Button, Checkbox, Collapse, FormControlLabel, FormGroup } from '@mui/material';
import { Grid } from '@mui/material';
import { TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import axios from "axios";
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import UpdateProduct from './UpdateProduct'; // Đường dẫn đúng file của bạn

export default function Products() {
  const navigate = useNavigate();
  const [keywords, setKeywords] = React.useState('');
  const [productData, setProductData] = React.useState([]);
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [categoryOpen, setCategoryOpen] = React.useState(true);
  const [actionFilter, setActionFilter] = React.useState('all');
  const [actionOpen, setActionOpen] = React.useState(true);
  const [sortBy, setSortBy] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editingProduct, setEditingProduct] = React.useState(null);


  React.useEffect(() => {
    axios.get("http://localhost:9999/api/seller/products?skipAuth=true")
      .then((res) => setProductData(res.data.data))
      .catch((error) => console.error("Error fetching projects:", error));
  }, []);


  // Lấy unique categories từ dữ liệu
  const categories = React.useMemo(() => {
    if (!productData || productData.length === 0) return [];
    const allCategories = productData
      .map(p => p.productId?.categoryId)
      .filter(Boolean);
    const map = new Map();
    allCategories.forEach(cat => {
      if (cat && cat._id && !map.has(cat._id)) {
        map.set(cat._id, cat);
      }
    });
    return Array.from(map.values());
  }, [productData]);

  const sortedData = React.useMemo(() => {
    let filtered = productData;

    // 1. Lọc theo từ khoá
    if (keywords.trim() !== "") {
      const keywordLower = keywords.trim().toLowerCase();
      filtered = filtered.filter(
        p =>
          p.productId.title && p.productId.title.toLowerCase().includes(keywordLower)
      );
    }

    // 2. Lọc theo category (dựa trên kết quả bước 1)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        p => selectedCategories.includes(p.productId.categoryId._id)
      );
    }

    // 3. Lọc theo trạng thái action (dựa trên kết quả bước 2)
    if (actionFilter === "available") {
      filtered = filtered.filter(p => p.productId.isAuction === true);
    }
    if (actionFilter === "notAvailable") {
      filtered = filtered.filter(p => p.productId.isAuction === false);
    }

    // 4. Sort
    const sortFields = sortBy
      ? (Array.isArray(sortBy) ? sortBy : sortBy.split(','))
      : [];
    return [...filtered].sort((a, b) => {
      for (let field of sortFields) {
        let res = 0;
        if (field === 'title') {
          res = (a.productId.title || '').localeCompare(b.productId.title || '');
        }
        if (res !== 0) return res;
      }
      return 0;
    });
  }, [productData, selectedCategories, sortBy, actionFilter, keywords]);

  const PRODUCTS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedData.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIdx = startIdx + PRODUCTS_PER_PAGE;
  const pageData = sortedData.slice(startIdx, endIdx);


  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, actionFilter, sortBy, keywords]);


  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSortProduct = (sortField) => {
    setSortBy(prev => {
      // Nếu đang sort tăng, thì đảo thành giảm, và ngược lại
      if (prev === sortField) return '-' + sortField;
      if (prev === '-' + sortField) return sortField;
      return sortField;
    });
  };

  const handleSearchByKeywords = () => {
    setCurrentPage(1);
  };

  return (
    <React.Fragment>
      <Grid>
        <Grid container spacing={2} mb={3} justifyContent="center" alignItems="center">
          <Grid item xs={8} md={6}>
            <TextField
              required
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              size="small"
              fullWidth
              id="outlined-basic"
              label="Search by name product"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={4} md={2}>
            <Button
              onClick={handleSearchByKeywords}
              variant="contained"
              endIcon={<SearchIcon />}
              fullWidth
              sx={{ height: '40px', width: '80%' }}
            >
              Search
            </Button>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={2}>
            {/* FilterCate */}
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setCategoryOpen((open) => !open)}
            >
              <Typography variant="h5"
                sx={{
                  userSelect: 'none',
                  flex: 1,          // đẩy icon ra phía cuối
                  display: 'flex',
                  alignItems: 'center'
                }}>
                Category
              </Typography>
              {categoryOpen ? (
                <ExpandLessIcon sx={{ ml: 1 }} />
              ) : (
                <ExpandMoreIcon sx={{ ml: 1 }} />
              )}
            </div>
            <Collapse in={categoryOpen} timeout="auto" unmountOnExit>
              <FormGroup>
                {categories.map((cat) => (
                  <FormControlLabel
                    key={cat._id}
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(cat._id)}
                        onChange={() => handleCategoryChange(cat._id)}
                        name={cat.name}
                        color="primary"
                      />
                    }
                    label={cat.name}
                  />
                ))}
              </FormGroup>
            </Collapse>
            {/* FilterAction */}
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setActionOpen((open) => !open)}
            >
              <Typography variant="h5"
                sx={{
                  userSelect: 'none',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                Action
              </Typography>
              {actionOpen ? (
                <ExpandLessIcon sx={{ ml: 1 }} />
              ) : (
                <ExpandMoreIcon sx={{ ml: 1 }} />
              )}
            </div>
            <Collapse in={actionOpen} timeout="auto" unmountOnExit>
              <RadioGroup
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <FormControlLabel value="all" control={<Radio />} label="All" />
                <FormControlLabel value="available" control={<Radio />} label="Available" />
                <FormControlLabel value="notAvailable" control={<Radio />} label="Not Available" />
              </RadioGroup>
            </Collapse>
          </Grid>

          <Grid item xs={10}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell ><Typography color="primary" style={{ cursor: 'pointer' }} onClick={() => handleSortProduct("title")}>Name</Typography></TableCell>
                  <TableCell ><Typography color="primary" >Action</Typography></TableCell>
                  <TableCell ><Typography color="primary" >Quantity</Typography></TableCell>
                  <TableCell ><Typography color="primary" >Description</Typography></TableCell>
                  <TableCell ><Typography color="primary" >Image</Typography></TableCell>
                  <TableCell ><Typography color="primary" >Price</Typography></TableCell>
                  <TableCell ><Typography color="primary" >Category</Typography></TableCell>
                  <TableCell ><Typography color="primary" >Tool</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageData.map((product, index) => (
                  <TableRow style={{ cursor: 'pointer' }} key={product.productId._id}>
                    <TableCell>
                      <Typography
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/product/${product.productId._id}`)}
                      >
                        {product.productId?.title}
                      </Typography>
                    </TableCell>

                    <TableCell>{product.productId?.isAuction ? "Available" : "Not Available"}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{product.productId?.description}</TableCell>
                    <TableCell>
                      <img src={product.productId?.image} alt="product" width={100} height={100} />
                    </TableCell>
                    <TableCell>{`$${product.productId?.price}`}</TableCell>
                    <TableCell>{product.productId?.categoryId.name}</TableCell>
                    <TableCell>
                      <Tooltip title="Update">
                        <EditIcon
                          color="primary"
                          style={{ cursor: 'pointer', marginRight: 8 }}
                          onClick={() => setEditingProduct(product)}
                        />
                      </Tooltip>
                      <Tooltip title="Delete">
                        <DeleteIcon color="error" style={{ cursor: 'pointer' }} />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Stack spacing={2} sx={{ mt: 3 }}>
              <Pagination
                page={currentPage}
                count={totalPages}
                onChange={(e, value) => setCurrentPage(value)}
                showFirstButton
                showLastButton
                sx={{ display: 'flex', justifyContent: 'center' }}
              />
            </Stack>
           {editingProduct && (
  <UpdateProduct
    targetProduct={editingProduct}
    onUpdated={() => {
      // reload lại danh sách sản phẩm sau update
      axios.get("http://localhost:9999/api/seller/products?skipAuth=true")
        .then((res) => setProductData(res.data.data));
      setEditingProduct(null);
    }}
    open={Boolean(editingProduct)}
    handleClose={() => setEditingProduct(null)}
  />
)}


          </Grid>

        </Grid>
      </Grid>
     
    </React.Fragment>
  );
}
