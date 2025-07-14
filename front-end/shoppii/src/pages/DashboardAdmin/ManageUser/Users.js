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
import UpdateUser from "./UpdateUser";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";

export default function Users({ users: initialUsers, onUserUpdated }) {
  const navigate = useNavigate();
  const [deletingUser, setDeletingUser] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [keywords, setKeywords] = React.useState("");
  const [selectedRoles, setSelectedRoles] = React.useState([]);
  const [actionFilter, setActionFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const response = await axios.delete(
        `http://localhost:9999/api/admin/users/${deletingUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
          params: { skipAuth: true }, // Chỉ dùng nếu backend xử lý skipAuth
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: "Xóa người dùng thành công!",
          severity: "success",
        });
        setDeletingUser(null);
        onUserUpdated(currentPage); // Tải lại trang hiện tại
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        msg: `Lỗi khi xóa người dùng! ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
      setDeletingUser(null);
    }
  };

  // Compute unique roles from users
  const roles = React.useMemo(() => {
    const roleSet = new Set();
    initialUsers.forEach((user) => {
      if (user.role) roleSet.add(user.role);
    });
    return Array.from(roleSet);
  }, [initialUsers]);

  // Filter users based on search, roles, and action
  const filteredUsers = React.useMemo(() => {
    let filtered = [...initialUsers];

    // 1. Filter by search (fullname or email)
    if (keywords.trim() !== "") {
      const keywordLower = keywords.trim().toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.fullname &&
            user.fullname.toLowerCase().includes(keywordLower)) ||
          (user.email && user.email.toLowerCase().includes(keywordLower))
      );
    }

    // 2. Filter by selected roles
    if (selectedRoles.length > 0) {
      filtered = filtered.filter((user) => selectedRoles.includes(user.role));
    }

    // 3. Filter by action status
    if (actionFilter === "lock") {
      filtered = filtered.filter((user) => user.action === "lock");
    } else if (actionFilter === "unlock") {
      filtered = filtered.filter((user) => user.action === "unlock");
    }

    return filtered;
  }, [initialUsers, keywords, selectedRoles, actionFilter]);

  const USERS_PER_PAGE = 10;
  const totalFilteredPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIdx = (currentPage - 1) * USERS_PER_PAGE;
  const endIdx = startIdx + USERS_PER_PAGE;
  const pageData = filteredUsers.slice(startIdx, endIdx);

  React.useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedRoles, actionFilter, keywords]);

  const handleRoleChange = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <React.Fragment>
      <Dialog
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
      >
        <DialogTitle>Xác nhận xoá người dùng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá người dùng{" "}
            <b>{deletingUser?.fullname || deletingUser?.email}</b> này không?
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingUser(null)} color="secondary">
            Huỷ
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
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
              {(selectedRoles.length > 0 || actionFilter !== "all") && (
                <Tooltip title="Clear all">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedRoles([]);
                      setActionFilter("all");
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
                label="Search by name/email"
                InputProps={{ endAdornment: <SearchIcon /> }}
              />
            </Box>

            {/* Role Filter */}
            <Box mb={2}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                ROLE
              </Typography>
              <Box
                sx={{
                  maxHeight: 160,
                  overflowY: roles.length > 4 ? "auto" : "unset",
                  mt: 1,
                  pr: 1,
                }}
              >
                <FormGroup>
                  {roles.map((role) => (
                    <FormControlLabel
                      key={role}
                      control={
                        <Checkbox
                          checked={selectedRoles.includes(role)}
                          onChange={() => handleRoleChange(role)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{role}</Typography>}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>

            {/* Action Filter */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                ACTION
              </Typography>
              <RadioGroup
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                sx={{ mt: 1 }}
              >
                <FormControlLabel
                  value="all"
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">All</Typography>}
                />
                <FormControlLabel
                  value="lock"
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">Locked</Typography>}
                />
                <FormControlLabel
                  value="unlock"
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">Unlocked</Typography>}
                />
              </RadioGroup>
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
                    <b>Full Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Email</b>
                  </TableCell>
                  <TableCell>
                    <b>Role</b>
                  </TableCell>
                  <TableCell>
                    <b>Action</b>
                  </TableCell>
                  <TableCell>
                    <b>Tool</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageData.map((user) => (
                  <TableRow style={{ cursor: "pointer" }} key={user._id}>
                    <TableCell>{user.fullname || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.action || "N/A"}</TableCell>
                    <TableCell>
                      <Tooltip title="Update">
                        <IconButton
                          color="primary"
                          style={{ marginRight: 8 }}
                          onClick={() => setEditingUser(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => setDeletingUser(user)}
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

          {editingUser && (
            <UpdateUser
              targetUser={editingUser}
              onUpdated={() => {
                onUserUpdated(currentPage);
                setEditingUser(null);
              }}
              open={Boolean(editingUser)}
              handleClose={() => setEditingUser(null)}
            />
          )}
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
