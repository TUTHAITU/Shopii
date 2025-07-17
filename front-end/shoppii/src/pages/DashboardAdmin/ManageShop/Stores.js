import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";
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
  Radio,
  RadioGroup,
  Snackbar,
  TableContainer,
  TextField,
  Typography,
  Grid,
} from "@mui/material";
import axios from "axios";
import UpdateStore from "./UpdateStore";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";

export default function Stores({ stores: initialStores, onStoreUpdated }) {
  const [deletingStore, setDeletingStore] = React.useState(null);
  const [editingStore, setEditingStore] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [keywords, setKeywords] = React.useState("");
  const [selectedStatuses, setSelectedStatuses] = React.useState([]);
  const [selectedRatingRanges, setSelectedRatingRanges] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleDeleteStore = async () => {
    if (!deletingStore) return;

    try {
      const response = await axios.delete(
        `http://localhost:9999/api/admin/stores/${deletingStore._id}?skipAuth=true`,
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
          msg: "Xóa cửa hàng thành công!",
          severity: "success",
        });
        setDeletingStore(null);
        onStoreUpdated(currentPage); // Tải lại trang hiện tại
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        msg: `Lỗi khi xóa cửa hàng! ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
      setDeletingStore(null);
    }
  };

  // Compute unique statuses from stores
  const statuses = React.useMemo(() => {
    const statusSet = new Set();
    initialStores.forEach((store) => {
      if (store.status) statusSet.add(store.status);
    });
    return Array.from(statusSet);
  }, [initialStores]);

  // Define rating ranges
  const ratingRanges = [
    { label: ">4", min: 4, max: 5.1 },
    { label: "3 < =<4", min: 3, max: 4 },
    { label: "2 < =<3", min: 2, max: 3 },
    { label: "=<2", min: 0, max: 2 },
  ];

  // Filter stores based on search, statuses, and rating ranges
  const filteredStores = React.useMemo(() => {
    let filtered = [...initialStores];

    // 1. Filter by search (storeName or seller username/email)
    if (keywords.trim() !== "") {
      const keywordLower = keywords.trim().toLowerCase();
      filtered = filtered.filter(
        (store) =>
          (store.storeName &&
            store.storeName.toLowerCase().includes(keywordLower)) ||
          (store.sellerId?.username &&
            store.sellerId.username.toLowerCase().includes(keywordLower)) ||
          (store.sellerId?.email &&
            store.sellerId.email.toLowerCase().includes(keywordLower))
      );
    }

    // 2. Filter by selected statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((store) =>
        selectedStatuses.includes(store.status)
      );
    }

    // 3. Filter by selected rating ranges
    if (selectedRatingRanges.length > 0) {
      filtered = filtered.filter((store) => {
        const rating = store.averageRating || 0;
        return selectedRatingRanges.some((rangeLabel) => {
          const range = ratingRanges.find((r) => r.label === rangeLabel);
          return rating > range.min && rating <= range.max; // Adjusted for >4, <=5; for others >=min <max, but tweaked for labels
        });
      });
    }

    return filtered;
  }, [initialStores, keywords, selectedStatuses, selectedRatingRanges]);

  const STORES_PER_PAGE = 10;
  const totalFilteredPages = Math.ceil(filteredStores.length / STORES_PER_PAGE);
  const startIdx = (currentPage - 1) * STORES_PER_PAGE;
  const endIdx = startIdx + STORES_PER_PAGE;
  const pageData = filteredStores.slice(startIdx, endIdx);

  React.useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedStatuses, keywords, selectedRatingRanges]);

  const handleStatusChange = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
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
        open={Boolean(deletingStore)}
        onClose={() => setDeletingStore(null)}
      >
        <DialogTitle>Xác nhận xoá cửa hàng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá cửa hàng <b>{deletingStore?.storeName}</b>{" "}
            này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingStore(null)} color="secondary">
            Huỷ
          </Button>
          <Button onClick={handleDeleteStore} color="error" variant="contained">
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
                selectedRatingRanges.length > 0) && (
                <Tooltip title="Clear all">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedStatuses([]);
                      setSelectedRatingRanges([]);
                      setKeywords("");
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
                label="Search by store name/seller"
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
                    <b>Store Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Seller Full Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Seller Email</b>
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
                {pageData.map((store) => (
                  <TableRow style={{ cursor: "pointer" }} key={store._id}>
                    <TableCell>{store.storeName}</TableCell>
                    <TableCell>{store.sellerId?.username || "N/A"}</TableCell>
                    <TableCell>{store.sellerId?.email}</TableCell>
                    <TableCell>{store.status}</TableCell>
                    <TableCell>
                      {store.averageRating
                        ? store.averageRating.toFixed(1)
                        : "N/A"}{" "}
                      ({store.totalReviews || 0} reviews)
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Update">
                        <IconButton
                          color="primary"
                          style={{ marginRight: 8 }}
                          onClick={() => setEditingStore(store)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => setDeletingStore(store)}
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

          {editingStore && (
            <UpdateStore
              targetStore={editingStore}
              onUpdated={() => {
                onStoreUpdated(currentPage);
                setEditingStore(null);
              }}
              open={Boolean(editingStore)}
              handleClose={() => setEditingStore(null)}
            />
          )}
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
