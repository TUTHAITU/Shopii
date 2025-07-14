// UpdateProduct.js
import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function UpdateProduct({
  targetProduct,
  onUpdated,
  open,
  handleClose,
}) {
  const [title, setTitle] = React.useState(targetProduct?.title || "");
  const [description, setDescription] = React.useState(
    targetProduct?.description || ""
  );
  const [price, setPrice] = React.useState(targetProduct?.price || "");
  const [status, setStatus] = React.useState(targetProduct?.status || "");
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });

  React.useEffect(() => {
    setTitle(targetProduct?.title || "");
    setDescription(targetProduct?.description || "");
    setPrice(targetProduct?.price || "");
    setStatus(targetProduct?.status || "");
  }, [targetProduct, open]);

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const reqBody = { title, description, price, status };
      const { data } = await axios.put(
        `http://localhost:9999/api/admin/products/${targetProduct._id}/status?skipAuth=true`,
        reqBody,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setSnackbar({
        open: true,
        msg: "Cập nhật thành công!",
        severity: "success",
      });
      if (onUpdated) onUpdated();
      handleClose();
    } catch (error) {
      setSnackbar({
        open: true,
        msg: error?.response?.data?.message || "Có lỗi xảy ra!",
        severity: "error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
          Update Product
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            To update product details, please fill out the information below and
            submit a request:
          </DialogContentText>
          <form onSubmit={handleUpdateProduct} sx={{ mt: 0 }}>
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Price"
              variant="outlined"
              fullWidth
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Status"
              variant="outlined"
              fullWidth
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={handleClose} variant="text" color="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </>
  );
}
