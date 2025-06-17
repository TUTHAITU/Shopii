import React, { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Box,
  TextField,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Grid,
  Pagination,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import axios from "axios";
import { useOutletContext } from "react-router-dom";

const statusColor = {
  pending: "default",
  shipping: "info",
  shipped: "success",
  "failed to ship": "error",
  rejected: "warning",
};

const statusOptions = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "shipping", label: "Shipping" },
  { value: "shipped", label: "Shipped" },
  { value: "failed to ship", label: "Failed to ship" },
  { value: "rejected", label: "Rejected" },
];

export default function ManageOrderHistory() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [orderItems, setOrderItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    handleSetDashboardTitle("Order History");
    fetchOrderHistory();
    // eslint-disable-next-line
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:9999/api/seller/orders/history?skipAuth=true");
      setOrderItems(res.data.data || []);
      setFilteredItems(res.data.data || []);
      setPage(1);
    } catch (error) {
      setOrderItems([]);
      setFilteredItems([]);
      setPage(1);
    }
    setLoading(false);
  };

  const handleFilter = () => {
    let filtered = orderItems;
    if (fromDate) {
      filtered = filtered.filter(
        (item) =>
          item.orderId?.orderDate &&
          new Date(item.orderId.orderDate) >= new Date(fromDate)
      );
    }
    if (toDate) {
      filtered = filtered.filter(
        (item) =>
          item.orderId?.orderDate &&
          new Date(item.orderId.orderDate) <= new Date(toDate + "T23:59:59")
      );
    }
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }
    setFilteredItems(filtered);
    setPage(1); // Reset về trang 1 sau khi filter
  };

  const sortedFilteredItems = [...filteredItems].sort(
    (a, b) => new Date(b.orderId?.orderDate) - new Date(a.orderId?.orderDate)
  );

  // Lấy data phân trang
  const paginatedItems = sortedFilteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(sortedFilteredItems.length / rowsPerPage);

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setStatus("");
    setFilteredItems(orderItems);
    setPage(1); // Reset về trang 1
  };

  const handleOpenDialog = (item) => {
    setSelectedOrder(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // First/Last page handlers
  const handleFirstPage = () => {
    if (page > 1) setPage(1);
  };
  const handleLastPage = () => {
    if (page < totalPages) setPage(totalPages);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ my: 2 }}>
        <TextField
          type="date"
          label="From date"
          InputLabelProps={{ shrink: true }}
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          size="small"
        />
        <TextField
          type="date"
          label="To date"
          InputLabelProps={{ shrink: true }}
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {statusOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFilter}
        >
          Filter
        </Button>
        <Button
          variant="outlined"
          onClick={handleReset}
        >
          Reset
        </Button>
      </Stack>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Order Date</strong></TableCell>
                  <TableCell><strong>Product Name</strong></TableCell>
                  <TableCell><strong>Image</strong></TableCell>
                  <TableCell><strong>Buyer</strong></TableCell>
                  <TableCell><strong>Quantity</strong></TableCell>
                  <TableCell><strong>Unit Price</strong></TableCell>
                  <TableCell><strong>Total Price</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      {item.orderId?.orderDate
                        ? new Date(item.orderId.orderDate).toLocaleDateString("en-GB")
                        : ""}
                    </TableCell>
                    <TableCell>
                      {item.productId?.title}
                    </TableCell>
                    <TableCell>
                      {item.productId?.image ? (
                        <img
                          src={item.productId.image}
                          alt=""
                          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6 }}
                        />
                      ) : (
                        ""
                      )}
                    </TableCell>
                    <TableCell>
                      {item.orderId?.buyerId?.username || ""}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unitPrice?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      ${item.unitPrice && item.quantity
                        ? (item.unitPrice * item.quantity).toLocaleString()
                        : 0}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={statusColor[item.status] || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
            <IconButton
              aria-label="first page"
              disabled={page === 1}
              onClick={handleFirstPage}
            >
              <FirstPageIcon />
            </IconButton>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handleChangePage}
              siblingCount={1}
              boundaryCount={1}
              showFirstButton={false}
              showLastButton={false}
              size="medium"
            />
            <IconButton
              aria-label="last page"
              disabled={page === totalPages || totalPages === 0}
              onClick={handleLastPage}
            >
              <LastPageIcon />
            </IconButton>
          </Box>
        </>
      )}

      {/* DIALOG FOR ORDER DETAIL */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Order Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={3}>
                {/* LEFT: Order Info */}
                <Grid item xs={12} sm={6} display="flex" flexDirection="column" gap={1}>
                  <Typography variant="h6" gutterBottom>
                    Order Information
                  </Typography>
                  <Divider />
                  <Typography variant="body2"><strong>Order ID:</strong> {selectedOrder.orderId?._id}</Typography>
                  <Typography variant="body2"><strong>Order Date:</strong> {selectedOrder.orderId?.orderDate ? new Date(selectedOrder.orderId.orderDate).toLocaleString("en-GB") : ""}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {selectedOrder.status}</Typography>
                  <Typography variant="body2"><strong>Buyer:</strong> {selectedOrder.orderId?.buyerId?.username}</Typography>
                  <Typography variant="body2"><strong>Product:</strong> {selectedOrder.productId?.title}</Typography>
                  <Typography variant="body2"><strong>Quantity:</strong> {selectedOrder.quantity}</Typography>
                  <Typography variant="body2"><strong>Unit Price:</strong> ${selectedOrder.unitPrice?.toLocaleString() || 0}</Typography>
                  <Typography variant="body2"><strong>Total Price:</strong> ${selectedOrder.unitPrice && selectedOrder.quantity ? (selectedOrder.unitPrice * selectedOrder.quantity).toLocaleString() : 0}</Typography>
                  {selectedOrder.productId?.image && (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <img
                        src={selectedOrder.productId.image}
                        alt=""
                        style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, border: '1px solid #eee' }}
                      />
                    </Box>
                  )}
                </Grid>
                {/* RIGHT: Shipping Address */}
                <Grid item xs={12} sm={6} display="flex" flexDirection="column" gap={1}>
                  <Typography variant="h6" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Divider />
                  <Typography variant="body2"><strong>Full Name:</strong> {selectedOrder.orderId?.addressId?.fullName || "-"}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedOrder.orderId?.addressId?.phone || "-"}</Typography>
                  <Typography variant="body2"><strong>Street:</strong> {selectedOrder.orderId?.addressId?.street || "-"}</Typography>
                  <Typography variant="body2"><strong>City:</strong> {selectedOrder.orderId?.addressId?.city || "-"}</Typography>
                  <Typography variant="body2"><strong>State:</strong> {selectedOrder.orderId?.addressId?.state || "-"}</Typography>
                  <Typography variant="body2"><strong>Country:</strong> {selectedOrder.orderId?.addressId?.country || "-"}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
