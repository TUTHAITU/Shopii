import React, { useEffect, useState } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Chip, Stack, CircularProgress, MenuItem
} from "@mui/material";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

const statusColor = {
    open: "warning",
    under_review: "info",
    resolved: "success",
    closed: "default"
};
const statusText = {
    open: "Open",
    under_review: "Under Review",
    resolved: "Resolved",
    closed: "Closed"
};

export default function ManageComplaint() {
    const { handleSetDashboardTitle } = useOutletContext();
    handleSetDashboardTitle("Manage Dispute");
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [resolveInput, setResolveInput] = useState("");
    const [resolveStatus, setResolveStatus] = useState("resolved");
    const [saving, setSaving] = useState(false);

    // Fetch dispute list
    useEffect(() => {
        setLoading(true);
        axios.get("http://localhost:9999/api/seller/disputes?skipAuth=true")
            .then(res => setDisputes(res.data.data))
            .finally(() => setLoading(false));
    }, []);

    const handleOpen = (row) => {
        setSelected(row);
        setResolveInput(row.resolution || "");
        setResolveStatus(row.status || "resolved");
    };

    const handleClose = () => {
        setSelected(null);
        setResolveInput("");
        setResolveStatus("resolved");
    };

    const handleResolve = async () => {
        if (!resolveInput.trim()) return;
        setSaving(true);
        await axios.put(`http://localhost:9999/api/seller/disputes/${selected._id}/resolve?skipAuth=true`, {
            resolution: resolveInput,
            status: resolveStatus,
        });
        // Refetch list
        const res = await axios.get("http://localhost:9999/api/seller/disputes?skipAuth=true");
        setDisputes(res.data.data);
        setSaving(false);
        handleClose();
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
                                <TableCell>Complaint Code</TableCell>
                                {/* <TableCell>Order Item Code</TableCell> */}
                                <TableCell>Complainant</TableCell>       
                                <TableCell>Description</TableCell>
                                <TableCell>Resolution</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell width={120}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {disputes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        No complaints found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {disputes.map(row => (
                                <TableRow key={row._id}>
                                    <TableCell>{row._id}</TableCell> 
                                    {/* <TableCell>
                                        {row.orderItemId?._id || <span style={{ color: "#888" }}>?</span>}
                                    </TableCell>*/}
                                    <TableCell>{row.raisedBy?.fullname}</TableCell>                                  
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>
                                        {row.resolution && row.resolution.trim()
                                            ? row.resolution
                                            : <span style={{ color: "#888" }}>No response yet</span>}
                                    </TableCell>
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
                                            Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Details & Resolution Dialog */}
            <Dialog open={!!selected} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Dispute Details</DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <>
                            <Typography gutterBottom>
                                <b>Order Code:</b> {selected.orderItemId?.orderId._id || <span style={{ color: "#888" }}>?</span>}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Complainant:</b> {selected.raisedBy?.fullname}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Complaint Description:</b> {selected.description}
                            </Typography>

                            <Typography gutterBottom><b>Product in Order:</b></Typography>
                            {selected.orderItemId ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell>Image</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell>Unit Price</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>{selected.orderItemId.productId?.title || "(deleted)"}</TableCell>
                                            <TableCell>
                                                {selected.orderItemId.productId?.image && (
                                                    <img src={selected.orderItemId.productId.image} alt=""
                                                        style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }} />
                                                )}
                                            </TableCell>
                                            <TableCell>{selected.orderItemId.quantity}</TableCell>
                                            <TableCell>
                                                {selected.orderItemId.unitPrice?.toLocaleString()} đ
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            ) : (
                                <Typography color="text.secondary">No product found.</Typography>
                            )}

                            <TextField
                                fullWidth
                                label="Resolution / Response"
                                value={resolveInput}
                                onChange={e => setResolveInput(e.target.value)}
                                margin="normal"
                                multiline
                                rows={3}
                            />
                            <TextField
                                select
                                label="Status"
                                value={resolveStatus}
                                onChange={e => setResolveStatus(e.target.value)}
                                margin="normal"
                                fullWidth
                            >
                                <MenuItem value="open">Open</MenuItem>
                                <MenuItem value="under_review">Under Review</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="closed">Closed</MenuItem>
                            </TextField>
                        </>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    <Button onClick={handleResolve} disabled={saving || !resolveInput.trim()} variant="contained">
                        {saving ? "Saving..." : "Save & Update"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
