import * as React from "react";
import {
    Table, TableHead, TableBody, TableRow, TableCell,
    TableContainer, Paper, IconButton, TextField, Snackbar, Alert, Pagination, Stack
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from '@mui/icons-material/Search';
import axios from "axios";
import { useOutletContext } from "react-router-dom";

export default function ManageInventory() {
    const { handleSetDashboardTitle } = useOutletContext();
    React.useEffect(() => {
        handleSetDashboardTitle("Manage Inventory");
    }, [handleSetDashboardTitle]);

    const [inventoryList, setInventoryList] = React.useState([]);
    const [editProductId, setEditProductId] = React.useState(null);
    const [editQuantity, setEditQuantity] = React.useState(0);
    const [search, setSearch] = React.useState('');
    const [snackbar, setSnackbar] = React.useState({ open: false, msg: '', severity: 'success' });
    const [currentPage, setCurrentPage] = React.useState(1);

    const ITEMS_PER_PAGE = 10;

    // Lấy dữ liệu tồn kho
    const fetchInventory = React.useCallback(() => {
        axios.get("http://localhost:9999/api/seller/products?skipAuth=true")
            .then(res => setInventoryList(res.data.data))
            .catch(() => setInventoryList([]));
    }, []);

    React.useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    // Lọc tìm kiếm
    const filteredList = React.useMemo(() => {
        if (!search.trim()) return inventoryList;
        return inventoryList.filter(item =>
            item.productId.title.toLowerCase().includes(search.trim().toLowerCase())
        );
    }, [inventoryList, search]);

    // Dữ liệu của trang hiện tại
    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
    const pagedList = React.useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredList.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredList, currentPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleEditClick = (productId, quantity) => {
        setEditProductId(productId);
        setEditQuantity(quantity);
    };

    const handleSaveClick = async (productId) => {
        try {
            await axios.put(`http://localhost:9999/api/seller/inventory/${productId}?skipAuth=true`, {
                quantity: editQuantity
            });
            setSnackbar({ open: true, msg: "Update thành công!", severity: 'success' });
            setEditProductId(null);

            fetchInventory();
        } catch (e) {
            setSnackbar({ open: true, msg: "Có lỗi xảy ra!", severity: 'error' });
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <TextField
                label="Search by name product"
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                sx={{ mb: 2, width: 320 }}
                InputProps={{ endAdornment: <SearchIcon /> }}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Image</b></TableCell>
                            <TableCell><b>Description</b></TableCell>
                            <TableCell><b>Category</b></TableCell>
                            <TableCell align="center"><b>Quantity</b></TableCell>
                            <TableCell align="center"><b>Edit</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pagedList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    Không có dữ liệu tồn kho.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagedList.map((item, idx) => (
                                <TableRow key={item.productId._id}>
                                    <TableCell>{item.productId.title}</TableCell>
                                    <TableCell>
                                        <img src={item.productId?.image} alt="product" width={100} height={100} />
                                    </TableCell>
                                    <TableCell>{item.productId?.description}</TableCell>
                                    <TableCell>{item.productId.categoryId?.name || "N/A"}</TableCell>
                                    <TableCell align="right">
                                        {editProductId === item.productId._id ? (
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={editQuantity}
                                                onChange={e => setEditQuantity(Number(e.target.value))}
                                                sx={{ width: 80 }}
                                                inputProps={{ min: 0 }}
                                            />
                                        ) : (
                                            item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {editProductId === item.productId._id ? (
                                            <IconButton color="primary" onClick={() => handleSaveClick(item.productId._id)}>
                                                <SaveIcon />
                                            </IconButton>
                                        ) : (
                                            <IconButton color="primary" onClick={() => handleEditClick(item.productId._id, item.quantity)}>
                                                <EditIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Stack spacing={2} sx={{ mt: 3 }}>
                <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, value) => setCurrentPage(value)}
                    showFirstButton
                    showLastButton
                    sx={{ display: 'flex', justifyContent: 'center' }}
                />
            </Stack>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
            </Snackbar>
        </Paper>
    );
}
