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
} from "@mui/material";
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

// --- Group orderItems by orderId ---
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");

  // Pagination for Orders
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
    setPage(1);
  };

  // Grouped Orders
  const groupedOrders = groupByOrderId(filteredItems);
  groupedOrders.sort((a, b) =>
    new Date(b.orderDate) - new Date(a.orderDate)
  );

  // Pagination trên từng đơn hàng
  const paginatedOrders = groupedOrders.slice(
    (page - 1) * ordersPerPage,
    page * ordersPerPage
  );
  const totalPages = Math.ceil(groupedOrders.length / ordersPerPage);

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setStatus("");
    setFilteredItems(orderItems);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  return (
    <Box>
      {/* Filter controls */}
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
        {/* <FormControl size="small" sx={{ minWidth: 120 }}>
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
        </FormControl> */}
        <Button variant="contained" color="primary" onClick={handleFilter}>
          Filter
        </Button>
        <Button variant="outlined" onClick={handleReset}>
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
                  <TableCell><strong>Order details</strong></TableCell>
                  <TableCell><strong>Order item </strong></TableCell>
                  <TableCell><strong>Shipping address</strong></TableCell>
                  <TableCell><strong>Total</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedOrders.map(order => (
                  <TableRow key={order._id}>
                    {/* Chi tiết đơn hàng */}
                    <TableCell>
                      <Typography fontWeight="bold" color="primary">
                        Order id: {order._id}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Status:{" "}
                        <Chip
                          label={order.products[0]?.status}
                          color={statusColor[order.products[0]?.status] || "default"}
                          size="small"
                        />
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Order date:{" "}
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleString("vi-VN")
                          : "-"}
                      </Typography>
                      {/* Thêm các thông tin khác nếu muốn */}
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
                              width: 50,
                              height: 50,
                              borderRadius: 6,
                              objectFit: "cover",
                              marginRight: 10,
                              border: "1px solid #ddd"
                            }}
                          />
                          <Box flex={1}>
                            <Stack spacing={0.2}>
                              <Typography variant="body2" fontWeight="bold" noWrap>
                                {prod.productId?.title}
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

                    {/* Địa chỉ giao hàng */}
                    <TableCell>
                      {order.address ? (
                        <Box>
                          <Typography variant="body2">
                            <strong>Full name:</strong> {order.address.fullName}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Phone number:</strong> {order.address.phone}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Address:</strong> {order.address.street}, {order.address.city}, {order.address.state}, {order.address.country}
                          </Typography>
                          {/* Hiển thị shipping info của sản phẩm đầu tiên (nếu có) */}
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
                        </Box>
                      ) : (
                        <Typography variant="body2">-</Typography>
                      )}
                    </TableCell>
                    {/* Giá trị đơn hàng */}
                    <TableCell>
                      <Typography fontWeight="bold" color="error">
                        ₫
                        {order.products
                          .reduce(
                            (sum, prod) =>
                              sum + (prod.unitPrice || 0) * (prod.quantity || 0),
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
            </Box>

          </Box>
        </>
      )}
    </Box>
  );
}