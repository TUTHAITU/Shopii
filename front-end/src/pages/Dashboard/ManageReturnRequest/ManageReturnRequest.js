import React, { useEffect, useState } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Chip, Stack, CircularProgress, MenuItem
} from "@mui/material";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

const statusColor = {
    pending: "warning",
    approved: "success",
    rejected: "error",
    completed: "info"
};
const statusText = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    completed: "Hoàn tất"
};

export default function ManageReturnRequest() {
    const { handleSetDashboardTitle } = useOutletContext();
    useEffect(() => { handleSetDashboardTitle("Quản lý yêu cầu trả hàng") }, [handleSetDashboardTitle]);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [status, setStatus] = useState("pending");
    const [saving, setSaving] = useState(false);
    const [reason, setReason] = useState("");

    // Fetch return request list
    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:9999/api/seller/return-requests?skipAuth=true");
            setRequests(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchList(); }, []);

    const handleOpen = (row) => {
        setSelected(row);
        setStatus(row.status || "pending");
        setReason(row.reason || "");
    };

    const handleClose = () => {
        setSelected(null);
        setStatus("pending");
        setReason("");
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await axios.put(`http://localhost:9999/api/seller/return-requests/${selected._id}?skipAuth=true`, {
                status
            });
            await fetchList();
            handleClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            {loading ? (
                <Stack alignItems="center"><CircularProgress /></Stack>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Mã yêu cầu</TableCell>
                                <TableCell>Người gửi</TableCell>
                                <TableCell>Sản phẩm</TableCell>
                                <TableCell>Lý do</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell width={120}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        Không có yêu cầu trả hàng nào.
                                    </TableCell>
                                </TableRow>
                            )}
                            {requests.map(row => (
                                <TableRow key={row._id}>
                                    <TableCell>{row._id}</TableCell>
                                    <TableCell>{row.userId?.fullname || row.userId?.username}</TableCell>
                                    <TableCell>
                                        {row.orderItemId?.productId?.title || "(Đã xóa sản phẩm)"}
                                    </TableCell>
                                    <TableCell>{row.reason}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={statusText[row.status] || row.status}
                                            color={statusColor[row.status] || "default"}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outlined" size="small" onClick={() => handleOpen(row)}>
                                            Chi tiết
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Details Dialog */}
            <Dialog open={!!selected} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Chi tiết yêu cầu trả hàng</DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <>
                            <Typography gutterBottom>
                                <b>Mã yêu cầu:</b> {selected._id}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Người gửi:</b> {selected.userId?.fullname || selected.userId?.username}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Sản phẩm:</b> {selected.orderItemId?.productId?.title}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Lý do trả hàng:</b> {selected.reason}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Trạng thái hiện tại:</b> {statusText[selected.status] || selected.status}
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                label="Cập nhật trạng thái"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                margin="normal"
                            >
                                <MenuItem value="pending">Chờ duyệt</MenuItem>
                                <MenuItem value="approved">Đã duyệt</MenuItem>
                                <MenuItem value="rejected">Từ chối</MenuItem>
                                <MenuItem value="completed">Hoàn tất</MenuItem>
                            </TextField>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Đóng</Button>
                    <Button
                        onClick={handleUpdate}
                        variant="contained"
                        disabled={saving}
                    >
                        {saving ? "Đang lưu..." : "Lưu & Cập nhật"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
