import React, { useEffect, useState } from 'react';
import {
    Grid, Card, CardContent, Typography, Box, Divider,
    Select, MenuItem, FormControl, InputLabel, Button
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import axios from 'axios';
import CustomLegend from './CustomLegend';
import { useOutletContext } from 'react-router-dom';

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
  "#A28FD0", "#FF6492", "#36CFC9", "#FFD700", 
  "#BDB76B", "#DC143C"
];

const TIME_OPTIONS = [
    { value: '', label: 'All Time' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Last 12 Months' }
];

const Overview = () => {
    const { handleSetDashboardTitle } = useOutletContext();
        handleSetDashboardTitle("DashBoard");
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchData = async (selectedPeriod = '') => {
        setLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:9999/api/seller/report?${selectedPeriod ? `period=${selectedPeriod}&` : ''}skipAuth=true`
            );
            setReport(res.data.data);
        } catch (error) {
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                <FormControl size="small">
                    <InputLabel id="period-label">Time Filter</InputLabel>
                    <Select
                        labelId="period-label"
                        value={period}
                        label="Time Filter"
                        onChange={e => setPeriod(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        {TIME_OPTIONS.map(opt => (
                            <MenuItem value={opt.value} key={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button variant="outlined" size="small" onClick={() => setPeriod('')}>
                    Reset
                </Button>
            </Box>

            {loading ? (
                <Typography>Loading...</Typography>
            ) : !report ? (
                <Typography color="error">No data</Typography>
            ) : (
                <Grid container spacing={3}>
                    {/* Summary Cards */}
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Total Revenue (Shipped)</Typography>
                                <Typography variant="h4" color="primary">
                                    ${report.totalRevenue?.toLocaleString() || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Unique Customers</Typography>
                                <Typography variant="h4">
                                    {report.uniqueCustomers || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Products Shipped</Typography>
                                <Typography variant="h4">
                                    {report.productsShipped || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Revenue by Category */}
                    <Grid item xs={12} sm={6}>
                        <Card sx={{ height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent
                                sx={{
                                    height: 420,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    '&:last-child': { pb: 2 },
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 1 }}>Revenue by Category</Typography>
                                {/* Chart nằm trong Box có flexGrow */}
                                <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={report.revenueByCategory}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, value }) => `${name} ${value}%`}
                                            >
                                                {report.revenueByCategory?.map((entry, index) => (
                                                    <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                {/* Legend luôn ở cuối */}
                                <Box sx={{ mt: 2 }}>
                                    <CustomLegend items={report.revenueByCategory} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Card sx={{ height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CardContent
                                sx={{
                                    height: 420,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    '&:last-child': { pb: 2 },
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 1 }}>Top Shipping Destinations</Typography>
                                <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={report.topDestinations}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, value }) => `${name} ${value}%`}
                                            >
                                                {report.topDestinations?.map((entry, index) => (
                                                    <Cell key={`dest-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <CustomLegend items={report.topDestinations} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>


                    {/* Revenue Over Time */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Revenue Over Time</Typography>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={report.revenueOverTime}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="revenue" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Top Products */}
                    <Grid item xs={12}>
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
                                {report.topProducts?.map((p, index) => (
                                    <Grid container key={index} sx={{ mt: 1 }}>
                                        <Grid item xs={6}>{p.product}</Grid>
                                        <Grid item xs={3}>{p.quantity}</Grid>
                                        <Grid item xs={3}>${p.revenue.toLocaleString()}</Grid>
                                    </Grid>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default Overview;
