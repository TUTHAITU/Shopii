import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link as MuiLink,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import axios from "axios";
import CustomLegend from "./CustomLegend";
import { useOutletContext } from "react-router-dom";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28FD0",
  "#FF6492",
  "#36CFC9",
  "#FFD700",
  "#BDB76B",
  "#DC143C",
];

const TIME_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last 12 Months" },
];

const Overview = () => {
  const { handleSetDashboardTitle } = useOutletContext();
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleSetDashboardTitle("Dashboard");
  }, [handleSetDashboardTitle]);

  const fetchData = async (selectedPeriod = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `http://localhost:9999/api/admin/report?${
          selectedPeriod ? `period=${selectedPeriod}&` : ""
        }skipAuth=true`
      );
      if (!res.data.success) {
        throw new Error("API response unsuccessful");
      }
      // Calculate percentages for revenueByCategory
      const revenueByCategory = res.data.insights.revenueByCategory || [];
      const totalRevenue = revenueByCategory.reduce(
        (sum, item) => sum + (item.value || 0),
        0
      );
      const revenueByCategoryWithPercent = revenueByCategory.map((item) => ({
        ...item,
        value:
          totalRevenue > 0
            ? Number(((item.value / totalRevenue) * 100).toFixed(1))
            : 0,
      }));
      // Prepare orderStatus for PieChart
      const orderStatus = res.data.summary.orderStatus || {};
      const orderStatusData = Object.entries(orderStatus)
        .map(([name, value]) => ({
          name,
          value,
        }))
        .filter((item) => item.value > 0);
      setReport({
        ...res.data,
        insights: {
          ...res.data.insights,
          revenueByCategory: revenueByCategoryWithPercent,
        },
        summary: {
          ...res.data.summary,
          orderStatus: orderStatusData,
        },
      });
    } catch (error) {
      console.error("Error fetching report:", error.message);
      setError("Failed to load data. Please try again.");
      setReport(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  return (
    <Box>
      {/* Time Filter */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
        <FormControl size="small">
          <InputLabel id="period-label">Time Filter</InputLabel>
          <Select
            labelId="period-label"
            value={period}
            label="Time Filter"
            onChange={(e) => setPeriod(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {TIME_OPTIONS.map((opt) => (
              <MenuItem value={opt.value} key={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" size="small" onClick={() => setPeriod("")}>
          Reset
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !report ? (
        <Typography color="error">No data available</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Revenue (Shipped)</Typography>
                <Typography variant="h4" color="primary">
                  ${report.summary.totalRevenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Orders</Typography>
                <Typography variant="h4">
                  {report.summary.totalOrders || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total user</Typography>
                <Typography variant="h4">
                  {report.summary.totalUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Unique Customers</Typography>
                <Typography variant="h4">
                  {report.summary.uniqueCustomers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Products Shipped</Typography>
                <Typography variant="h4">
                  {report.summary.productsShipped || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Buyers</Typography>
                <Typography variant="h4">
                  {report.summary.activeBuyers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Sellers</Typography>
                <Typography variant="h4">
                  {report.summary.activeSellers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Conversion Rate</Typography>
                <Typography variant="h4">
                  {report.summary.conversionRate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Status Breakdown */}
          {report.summary.orderStatus?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: 420,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <CardContent
                  sx={{
                    height: 420,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: 2,
                    "&:last-child": { pb: 2 },
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Order Status Breakdown
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.summary.orderStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {report.summary.orderStatus.map((entry, index) => (
                            <Cell
                              key={`status-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <CustomLegend items={report.summary.orderStatus} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Revenue by Category */}
          {report.insights.revenueByCategory?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: 420,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <CardContent
                  sx={{
                    height: 420,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: 2,
                    "&:last-child": { pb: 2 },
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Revenue by Category
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.insights.revenueByCategory}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {report.insights.revenueByCategory.map(
                            (entry, index) => (
                              <Cell
                                key={`cat-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <CustomLegend items={report.insights.revenueByCategory} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Revenue Over Time */}
          {report.trends.revenueOverTime?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Revenue Over Time</Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={report.trends.revenueOverTime}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Orders Over Time */}
          {report.trends.orderOverTime?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Orders Over Time</Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={report.trends.orderOverTime}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#36CFC9" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Top Products */}
          {report.insights.topProducts?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Products
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Product
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Quantity Sold
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Revenue
                      </Typography>
                    </Grid>
                  </Grid>
                  {report.insights.topProducts.map((p, index) => (
                    <Grid container key={index} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        {p.product}
                      </Grid>
                      <Grid item xs={3}>
                        {p.quantity}
                      </Grid>
                      <Grid item xs={3}>
                        ${p.revenue.toLocaleString()}
                      </Grid>
                    </Grid>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Top Sellers */}
          {report.topSellers?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Sellers
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Seller
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Total Revenue
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Order Count
                      </Typography>
                    </Grid>
                  </Grid>
                  {report.topSellers.map((s, index) => (
                    <Grid container key={index} sx={{ mt: 1 }}>
                      <Grid item xs={4}>
                        {s.seller}
                      </Grid>
                      <Grid item xs={4}>
                        ${s.totalRevenue.toLocaleString()}
                      </Grid>
                      <Grid item xs={4}>
                        {s.orderCount}
                      </Grid>
                    </Grid>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Ratings */}
          {report.ratings && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Product Ratings
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      <b>Average Rating:</b> {report.ratings.averageRating || 0}
                    </Typography>
                    <Typography variant="subtitle1">
                      <b>Total Reviews:</b> {report.ratings.totalReviews || 0}
                    </Typography>
                  </Box>
                  {report.ratings.topRatedProducts?.length > 0 && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Top Rated Products
                      </Typography>
                      <Grid container>
                        <Grid item xs={6}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Product
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Average Rating
                          </Typography>
                        </Grid>
                      </Grid>
                      {report.ratings.topRatedProducts.map((p, index) => (
                        <Grid container key={index} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            {p.product}
                          </Grid>
                          <Grid item xs={6}>
                            {p.avgRating}
                          </Grid>
                        </Grid>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Returns and Disputes */}
          {report.returns && (
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Returns and Disputes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1">
                    <b>Return Requests:</b>{" "}
                    {report.returns.returnRequestsCount || 0}
                  </Typography>
                  <Typography variant="subtitle1">
                    <b>Open Disputes:</b> {report.returns.disputesCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Stock Status */}
          {report.stock &&
            (report.stock.lowStockProducts?.length > 0 ||
              report.stock.outOfStockProducts?.length > 0) && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stock Status
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {report.stock.lowStockProducts?.length > 0 && (
                      <>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Low Stock Products (&lt; 20)
                        </Typography>
                        <Grid container>
                          <Grid item xs={6}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Product
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Quantity
                            </Typography>
                          </Grid>
                        </Grid>
                        {report.stock.lowStockProducts.map((p, index) => (
                          <Grid container key={index} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                              {p.product}
                            </Grid>
                            <Grid item xs={6}>
                              {p.quantity}
                            </Grid>
                          </Grid>
                        ))}
                      </>
                    )}
                    {report.stock.outOfStockProducts?.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ mt: 2 }}
                        >
                          Out of Stock Products
                        </Typography>
                        <Grid container>
                          <Grid item xs={6}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Product
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Quantity
                            </Typography>
                          </Grid>
                        </Grid>
                        {report.stock.outOfStockProducts.map((p, index) => (
                          <Grid container key={index} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                              {p.product}
                            </Grid>
                            <Grid item xs={6}>
                              {p.quantity}
                            </Grid>
                          </Grid>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

          {/* Recent Activity */}
          {report.activities.recentActivity?.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity (Last 10)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <b>Type</b>
                        </TableCell>
                        <TableCell>
                          <b>Details</b>
                        </TableCell>
                        <TableCell>
                          <b>Created At</b>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.activities.recentActivity.map(
                        (activity, index) => (
                          <TableRow key={index}>
                            <TableCell>{activity.type}</TableCell>
                            <TableCell>{activity.details}</TableCell>
                            <TableCell>
                              {new Date(activity.createdAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Overview;
