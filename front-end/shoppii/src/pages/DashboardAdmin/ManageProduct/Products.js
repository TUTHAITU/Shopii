// Products.js
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from "@mui/material/Tooltip";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Snackbar,
  TableContainer,
  TextField,
  Typography,
  Grid,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import UpdateProduct from "./UpdateProduct";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";

export default function Products({
  products: initialProducts,
  onProductUpdated,
}) {
  const [deletingProduct, setDeletingProduct] = React.useState(null);
  const [editingProduct, setEditingProduct] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [keywords, setKeywords] = React.useState("");
  const [selectedStatuses, setSelectedStatuses] = React.useState([]);
  const [selectedStores, setSelectedStores] = React.useState([]);
  const [selectedRatingRanges, setSelectedRatingRanges] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [storeSearch, setStoreSearch] = React.useState("");
  const [productRatings, setProductRatings] = React.useState({});

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      const response = await axios.delete(
        `http://localhost:9999/api/admin/products/${deletingProduct._id}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: "Xóa sản phẩm thành công!",
          severity: "success",
        });
        setDeletingProduct(null);
        onProductUpdated(currentPage); // Tải lại trang hiện tại
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        msg: `Lỗi khi xóa sản phẩm! ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
      setDeletingProduct(null);
    }
  };

  // Compute unique statuses from products
  const statuses = React.useMemo(() => {
    const statusSet = new Set();
    initialProducts.forEach((product) => {
      if (product.status) statusSet.add(product.status);
    });
    return Array.from(statusSet);
  }, [initialProducts]);

  // Compute unique stores/sellers from products
  const stores = React.useMemo(() => {
    const storeMap = new Map();
    initialProducts.forEach((product) => {
      if (product.sellerId) {
        const sellerId = product.sellerId._id;
        const sellerName = product.sellerId.username || "Unknown";
        if (!storeMap.has(sellerId)) {
          storeMap.set(sellerId, sellerName);
        }
      }
    });
    return Array.from(storeMap, ([id, name]) => ({ id, name }));
  }, [initialProducts]);

  // Filtered stores based on storeSearch
  const filteredStores = React.useMemo(() => {
    if (!storeSearch.trim()) return stores;
    const searchLower = storeSearch.trim().toLowerCase();
    return stores.filter((store) =>
      store.name.toLowerCase().includes(searchLower)
    );
  }, [stores, storeSearch]);

  // Define rating ranges
  const ratingRanges = [
    { label: ">4", min: 4, max: 5.1 },
    { label: "3 <= <4", min: 3, max: 4 },
    { label: "2 <= <3", min: 2, max: 3 },
    { label: "<2", min: 0, max: 2 },
  ];

  // Fetch ratings for products
  React.useEffect(() => {
    const fetchRatings = async () => {
      const ratings = {};
      await Promise.all(
        initialProducts.map(async (product) => {
          try {
            const res = await axios.get(
              `http://localhost:9999/api/admin/products/${product._id}/reviews?skipAuth=true`
            );
            ratings[product._id] = {
              averageRating: parseFloat(res.data.averageRating),
              totalReviews: res.data.totalReviews,
            };
          } catch (error) {
            console.error(
              `Error fetching ratings for product ${product._id}:`,
              error
            );
            ratings[product._id] = { averageRating: 0, totalReviews: 0 };
          }
        })
      );
      setProductRatings(ratings);
    };
    fetchRatings();
  }, [initialProducts]);

  // Filter products based on search, statuses, stores, and rating ranges
  const filteredProducts = React.useMemo(() => {
    let filtered = [...initialProducts.map((product) => ({ ...product }))]; // Copy to modify

    filtered = filtered.map((product) => {
      const ratingInfo = productRatings[product._id] || {
        averageRating: 0,
        totalReviews: 0,
      };
      product.averageRating = ratingInfo.averageRating;
      product.totalReviews = ratingInfo.totalReviews;
      return product;
    });

    // 1. Filter by search (title or description)
    if (keywords.trim() !== "") {
      const keywordLower = keywords.trim().toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.title &&
            product.title.toLowerCase().includes(keywordLower)) ||
          (product.description &&
            product.description.toLowerCase().includes(keywordLower))
      );
    }

    // 2. Filter by selected statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((product) =>
        selectedStatuses.includes(product.status)
      );
    }

    // 3. Filter by selected stores (sellerId)
    if (selectedStores.length > 0) {
      filtered = filtered.filter((product) =>
        selectedStores.includes(product.sellerId?._id)
      );
    }

    // 4. Filter by selected rating ranges
    if (selectedRatingRanges.length > 0) {
      filtered = filtered.filter((product) => {
        const rating = product.averageRating || 0;
        return selectedRatingRanges.some((rangeLabel) => {
          const range = ratingRanges.find((r) => r.label === rangeLabel);
          return rating > range.min && rating <= range.max;
        });
      });
    }

    return filtered;
  }, [
    initialProducts,
    keywords,
    selectedStatuses,
    selectedStores,
    selectedRatingRanges,
    productRatings,
  ]);

  const PRODUCTS_PER_PAGE = 10;
  const totalFilteredPages = Math.ceil(
    filteredProducts.length / PRODUCTS_PER_PAGE
  );
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIdx = startIdx + PRODUCTS_PER_PAGE;
  const pageData = filteredProducts.slice(startIdx, endIdx);

  React.useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedStatuses, selectedStores, selectedRatingRanges, keywords]);

  const handleStatusChange = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleStoreChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedStores(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  const handleRatingRangeChange = (rangeLabel) => {
    setSelectedRatingRanges((prev) =>
      prev.includes(rangeLabel)
        ? prev.filter((r) => r !== rangeLabel)
        : [...prev, rangeLabel]
    );
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <React.Fragment>
      <Dialog
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
      >
        <DialogTitle>Xác nhận xoá sản phẩm</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá sản phẩm <b>{deletingProduct?.title}</b>{" "}
            này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingProduct(null)} color="secondary">
            Huỷ
          </Button>
          <Button
            onClick={handleDeleteProduct}
            color="error"
            variant="contained"
          >
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              borderRadius: 3,
              bgcolor: "background.paper",
              p: 2,
              mb: 3,
              minWidth: 200,
              maxWidth: 260,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                letterSpacing={2}
              >
                <FilterAltIcon
                  fontSize="small"
                  sx={{ mr: 0.5, color: "primary.main" }}
                />
                FILTERS
              </Typography>
              {(selectedStatuses.length > 0 ||
                selectedStores.length > 0 ||
                selectedRatingRanges.length > 0) && (
                <Tooltip title="Clear all">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedStatuses([]);
                      setSelectedStores([]);
                      setSelectedRatingRanges([]);
                      setKeywords("");
                      setStoreSearch("");
                    }}
                  >
                    <ClearAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Search */}
            <Box mb={2}>
              <TextField
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                size="small"
                fullWidth
                label="Search by title/description"
                InputProps={{ endAdornment: <SearchIcon /> }}
              />
            </Box>

            {/* Status Filter */}
            <Box mb={2}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                STATUS
              </Typography>
              <Box
                sx={{
                  maxHeight: 160,
                  overflowY: statuses.length > 4 ? "auto" : "unset",
                  mt: 1,
                  pr: 1,
                }}
              >
                <FormGroup>
                  {statuses.map((status) => (
                    <FormControlLabel
                      key={status}
                      control={
                        <Checkbox
                          checked={selectedStatuses.includes(status)}
                          onChange={() => handleStatusChange(status)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{status}</Typography>}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>

            {/* Store Filter - Dropdown with search */}
            <Box mb={2}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                STORE
              </Typography>
              <Box mt={1}>
                <TextField
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  size="small"
                  fullWidth
                  label="Search stores"
                  InputProps={{ endAdornment: <SearchIcon /> }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  select
                  label="Select stores"
                  variant="outlined"
                  fullWidth
                  value={selectedStores}
                  onChange={handleStoreChange}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      selected
                        .map(
                          (id) => stores.find((s) => s.id === id)?.name || ""
                        )
                        .join(", "),
                  }}
                >
                  {filteredStores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      <Checkbox
                        checked={selectedStores.indexOf(store.id) > -1}
                      />
                      {store.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {/* Rating Filter */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                RATING
              </Typography>
              <Box
                sx={{
                  maxHeight: 160,
                  overflowY: "auto",
                  mt: 1,
                  pr: 1,
                }}
              >
                <FormGroup>
                  {ratingRanges.map((range) => (
                    <FormControlLabel
                      key={range.label}
                      control={
                        <Checkbox
                          checked={selectedRatingRanges.includes(range.label)}
                          onChange={() => handleRatingRangeChange(range.label)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">{range.label}</Typography>
                      }
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              border: "1px solid #ddd",
              boxShadow: "none",
            }}
          >
            <Table sx={{ borderCollapse: "separate" }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>Title</b>
                  </TableCell>
                  <TableCell>
                    <b>Price</b>
                  </TableCell>
                  <TableCell>
                    <b>Seller</b>
                  </TableCell>
                  <TableCell>
                    <b>Status</b>
                  </TableCell>
                  <TableCell>
                    <b>Rating</b>
                  </TableCell>
                  <TableCell>
                    <b>Tool</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageData.map((product) => (
                  <TableRow style={{ cursor: "pointer" }} key={product._id}>
                    <TableCell>{product.title}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>{product.sellerId?.username || "N/A"}</TableCell>
                    <TableCell>{product.status}</TableCell>
                    <TableCell>
                      {product.averageRating
                        ? product.averageRating.toFixed(1)
                        : "N/A"}{" "}
                      ({product.totalReviews || 0} reviews)
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Update">
                        <IconButton
                          color="primary"
                          style={{ marginRight: 8 }}
                          onClick={() => setEditingProduct(product)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Pagination
              page={currentPage}
              count={totalFilteredPages}
              onChange={handlePageChange}
              showFirstButton
              showLastButton
              sx={{ display: "flex", justifyContent: "center" }}
            />
          </Stack>

          {editingProduct && (
            <UpdateProduct
              targetProduct={editingProduct}
              onUpdated={() => {
                onProductUpdated(currentPage);
                setEditingProduct(null);
              }}
              open={Boolean(editingProduct)}
              handleClose={() => setEditingProduct(null)}
            />
          )}
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
