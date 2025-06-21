import React, { useEffect, useState } from "react";
import {
  Paper,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  IconButton
} from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import axios from "axios";
import { useOutletContext } from "react-router-dom";

function groupByOrderId(orderItems) {
  const orders = {};
  orderItems.forEach(item => {
    const oid = item.orderId?._id;
    if (!oid) return;
    if (!orders[oid]) {
      orders[oid] = {
        ...item.orderId,
        address: item.orderId?.addressId,
        products: [],
      };
    }
    orders[oid].products.push(item);
  });
  return Object.values(orders);
}

export default function ManageOrderHistory() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [orderItems, setOrderItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Các filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchField, setSearchField] = useState("orderId");
  const [searchValue, setSearchValue] = useState("");

  // Dialog thống kê
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const handleOpenStatsDialog = () => setOpenStatsDialog(true);
  const handleCloseStatsDialog = () => setOpenStatsDialog(false);

  // Pagination
  const [page, setPage] = useState(1);
  const ordersPerPage = 5;

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

  // --- DÙNG CHUNG 1 NÚT SEARCH ---
  const handleSearchAll = () => {
    let filtered = orderItems;
    // Filter by orderId/orderItemId
    if (searchValue.trim()) {
      if (searchField === "orderId") {
        filtered = filtered.filter(item =>
          item.orderId?._id?.toLowerCase().includes(searchValue.trim().toLowerCase())
        );
      }
      if (searchField === "orderItemId") {
        filtered = filtered.filter(item =>
          item._id?.toLowerCase().includes(searchValue.trim().toLowerCase())
        );
      }
    }
    // Filter by date
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
    setFilteredItems(filtered);
    setPage(1);
  };

  // --- RESET ---
  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setSearchValue("");
    setSearchField("orderId");
    setFilteredItems(orderItems);
    setPage(1);
  };

  // Grouped Orders & Statistics
  const groupedOrders = groupByOrderId(filteredItems);
  groupedOrders.sort((a, b) =>
    new Date(b.orderDate) - new Date(a.orderDate)
  );
  const calcOrderStats = (groupedOrders) => {
    let shipped = 0, shippedAmount = 0;
    let pending = 0, shipping = 0, expectedAmount = 0;
    groupedOrders.forEach(order => {
      order.products.forEach(prod => {
        const totalPrice = (prod.unitPrice || 0) * (prod.quantity || 0);
        if (prod.status === "shipped") {
          shipped += 1;
          shippedAmount += totalPrice;
        }
        if (prod.status === "pending") {
          pending += 1;
          expectedAmount += totalPrice;
        }
        if (prod.status === "shipping") {
          shipping += 1;
          expectedAmount += totalPrice;
        }
      });
    });
    return {
      shipped, shippedAmount,
      pending, shipping, expected: pending + shipping, expectedAmount
    };
  };
  const { shipped, shippedAmount, pending, shipping, expected, expectedAmount } = calcOrderStats(groupedOrders);

  // Pagination
  const paginatedOrders = groupedOrders.slice(
    (page - 1) * ordersPerPage,
    page * ordersPerPage
  );
  const totalPages = Math.ceil(groupedOrders.length / ordersPerPage);

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  return (
    <Box>
      {/* --- ALL FILTER --- */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, alignItems: "center" }}>
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
        <FormControl size="small">
          <InputLabel id="search-field-label">Tìm theo</InputLabel>
          <Select
            labelId="search-field-label"
            value={searchField}
            onChange={e => setSearchField(e.target.value)}
            label="Tìm theo"
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="orderId">Order ID</MenuItem>
            <MenuItem value="orderItemId">Order Item ID</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Nhập giá trị"
          size="small"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearchAll(); }}
          sx={{ minWidth: 180 }}
        />
        <Button variant="contained" onClick={handleSearchAll}>Search</Button>
        <Button variant="outlined" onClick={handleReset}>Reset</Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="40%"><strong>Order Detail</strong></TableCell>
                  <TableCell width="50%"><strong>Order Item</strong></TableCell>
                  <TableCell width="10%"><strong>Total</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedOrders.map(order => (
                  <TableRow key={order._id}>
                    {/* Chi tiết đơn hàng + Địa chỉ giao hàng */}
                    <TableCell>
                      <Typography fontWeight="bold" color="primary">
                        Order id: {order._id}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Order date:{" "}
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleString("vi-VN")
                          : "-"}
                      </Typography>
                      {/* Địa chỉ giao hàng */}
                      {order.address && (
                        <Box mt={1}>
                          <Typography variant="body2">
                            <strong>Full name:</strong> {order.address.fullName}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Phone number:</strong> {order.address.phone}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Address:</strong> {order.address.street}, {order.address.city}, {order.address.state}, {order.address.country}
                          </Typography>
                        </Box>
                      )}
                      {/* Shipping info của sản phẩm đầu tiên (nếu có) */}
                      {order.products[0]?.shippingInfo && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            background: "#f6f8fa",
                            borderRadius: 1,
                            border: "1px dashed #ddd"
                          }}
                        >
                          <Typography variant="caption" color="primary">
                            <b>Shipping Info:</b>
                          </Typography>
                          <Typography variant="caption" display="block">
                            Carrier: {order.products[0].shippingInfo.carrier}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Tracking: {order.products[0].shippingInfo.trackingNumber}
                          </Typography>
                          <Typography variant="caption" display="block">
                            ETA: {order.products[0].shippingInfo.estimatedArrival ? new Date(order.products[0].shippingInfo.estimatedArrival).toLocaleDateString('vi-VN') : "-"}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    {/* Thông tin sản phẩm */}
                    <TableCell>
                      {order.products.map((prod, idx) => (
                        <Box
                          key={prod._id}
                          display="flex"
                          alignItems="center"
                          mb={1}
                          py={1}
                          borderBottom={idx < order.products.length - 1 ? "1px solid #eee" : "none"}
                        >
                          <img
                            src={prod.productId?.image}
                            alt=""
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 6,
                              objectFit: "cover",
                              marginRight: 10,
                              border: "1px solid #ddd"
                            }}
                          />
                          <Box flex={1}>
                            <Stack spacing={0.2} direction="row" alignItems="center">
                              <Typography variant="body2" fontWeight="bold" noWrap sx={{ mr: 1 }}>
                                {prod.productId?.title}
                              </Typography>
                              <Chip
                                size="small"
                                label={prod.status}
                                color={
                                  prod.status === "pending" ? "default" :
                                    prod.status === "shipping" ? "info" :
                                      prod.status === "shipped" ? "success" :
                                        prod.status === "failed to ship" ? "error" :
                                          prod.status === "rejected" ? "warning" : "default"
                                }
                                sx={{ textTransform: "capitalize", height: 22 }}
                              />
                            </Stack>
                            <Stack spacing={0.2}>
                              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                                <strong>OrderItem ID: {prod._id}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                                <strong>Product ID: {prod.productId?._id}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                Category: {prod.productId?.categoryId?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                x{prod.quantity} - ₫{prod.unitPrice?.toLocaleString()}
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>
                      ))}
                    </TableCell>
                    {/* Giá trị đơn hàng */}
                    <TableCell>
                      <Typography fontWeight="bold" color="error">
                        ₫
                        {order.products
                          .filter(prod => ["shipping", "pending", "shipped"].includes(prod.status))
                          .reduce(
                            (sum, prod) => sum + (prod.unitPrice || 0) * (prod.quantity || 0),
                            0
                          )
                          .toLocaleString()}
                      </Typography>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={handleChangePage}
              siblingCount={1}
              boundaryCount={1}
              size="medium"
              showFirstButton
              showLastButton
            />

            {/* FAB + Dialog góc dưới phải */}
            <Fab
              color="primary"
              aria-label="order-stats"
              onClick={handleOpenStatsDialog}
              sx={{
                position: 'fixed',
                bottom: 32,
                right: 32,
                zIndex: 1301,
              }}
              size="medium"
              title="View Order Stats"
            >
              <Badge color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </Fab>

            <Dialog
              open={openStatsDialog}
              onClose={handleCloseStatsDialog}
              PaperProps={{
                sx: {
                  position: 'fixed',
                  m: 0,
                  bottom: 88,
                  right: 32,
                  width: 320,
                  borderRadius: 3,
                  boxShadow: 6,
                  p: 0,
                }
              }}
              hideBackdrop
            >
              <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, pr: 1 }}>
                Order Statistics
                <IconButton onClick={handleCloseStatsDialog} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 1, pb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocalShippingIcon color="success" />
                  <Box>
                    <Typography fontWeight={600}>Total paid (shipped):</Typography>
                    <Typography color="success.main" fontWeight={600}>
                      ₫{shippedAmount.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <PendingActionsIcon color="warning" />
                  <Box>
                    <Typography fontWeight={600}>Total to be paid (pending, shipping):</Typography>
                    <Typography color="warning.main" fontWeight={600}>
                      ₫{expectedAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" ml={1} color="text.secondary">
                      ({pending} pending, {shipping} shipping)
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
            </Dialog>
          </Box>
        </>
      )}
    </Box>
  );
}
