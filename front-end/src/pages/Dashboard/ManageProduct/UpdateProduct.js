import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function UpdateProduct({ targetProduct, onUpdated, open, handleClose }) {
    const [categories, setCategories] = React.useState([]);

    // Product state
    const [title, setTitle] = React.useState(targetProduct?.productId?.title || '');
    const [description, setDescription] = React.useState(targetProduct?.productId?.description || '');
    const [categoryId, setCategoryId] = React.useState(targetProduct?.productId?.categoryId?._id || '');
    const [price, setPrice] = React.useState(targetProduct?.productId?.price || 0);
    const [image, setImage] = React.useState(targetProduct?.productId?.image || '');
    const [isAuction, setIsAuction] = React.useState(targetProduct?.productId?.isAuction ? 'true' : 'false');
    const [auctionEndTime, setAuctionEndTime] = React.useState(targetProduct?.productId?.auctionEndTime || '');
    const [quantity, setQuantity] = React.useState(targetProduct?.quantity || 0);

    // Notification
    const [snackbar, setSnackbar] = React.useState({ open: false, msg: '', severity: 'success' });

    React.useEffect(() => {
        axios.get('http://localhost:9999/api/seller/products?skipAuth=true')
            .then(res => setCategories(res.data.data))
            .catch(() => setCategories([]));
    }, []);
    const cate = React.useMemo(() => {
        if (!categories || categories.length === 0) return [];
        const allCategories = categories
            .map(p => p.productId?.categoryId)
            .filter(Boolean);
        const map = new Map();
        allCategories.forEach(cat => {
            if (cat && cat._id && !map.has(cat._id)) {
                map.set(cat._id, cat);
            }
        });
        return Array.from(map.values());
    }, [categories]);

    React.useEffect(() => {
        setTitle(targetProduct?.productId?.title || '');
        setDescription(targetProduct?.productId?.description || '');
        setCategoryId(targetProduct?.productId?.categoryId?._id || '');
        setPrice(targetProduct?.productId?.price || 0);
        setImage(targetProduct?.productId?.image || '');
        setIsAuction(targetProduct?.productId?.isAuction ? 'true' : 'false');
        setAuctionEndTime(targetProduct?.productId?.auctionEndTime || '');
        setQuantity(targetProduct?.quantity || 0);
    }, [targetProduct, open]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            const reqBody = {
                title,
                description,
                price: Number(price),
                image,
                categoryId,
                isAuction: isAuction === 'true',
                auctionEndTime: isAuction === 'true' ? auctionEndTime : undefined,
                quantity: Number(quantity)
            };
            const { data } = await axios.put(
                `http://localhost:9999/api/seller/products/${targetProduct.productId._id}?skipAuth=true`,
                reqBody
            );

            setSnackbar({ open: true, msg: "Cập nhật thành công!", severity: 'success' });
            if (onUpdated) onUpdated();
            handleClose();
        } catch (error) {
            setSnackbar({ open: true, msg: error?.response?.data?.message || "Có lỗi xảy ra!", severity: 'error' });
        }
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
                    Cập nhật sản phẩm
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Chỉnh sửa thông tin sản phẩm bên dưới:
                    </DialogContentText>
                    <Box component="form" onSubmit={handleUpdateProduct} sx={{ mt: 0 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Tên sản phẩm" variant="outlined" size="small"
                                    fullWidth required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Giá" type="number" variant="outlined" size="small"
                                    fullWidth required
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Danh mục" select variant="outlined" size="small"
                                    fullWidth required
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}>
                                    {cate.map(cate => (
                                        <MenuItem key={cate._id} value={cate._id}>{cate.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Số lượng tồn kho" type="number" variant="outlined" size="small"
                                    fullWidth required
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Mô tả" variant="outlined" size="small"
                                    fullWidth multiline minRows={2} maxRows={4}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField label="Image URL" variant="outlined" size="small"
                                    fullWidth
                                    value={image}
                                    onChange={e => setImage(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button component="label" startIcon={<CloudUploadIcon />} variant="outlined"
                                    sx={{ width: "100%", height: "40px" }}>
                                    Upload
                                    <VisuallyHiddenInput type="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Trạng thái bán"
                                    select
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    value={isAuction}
                                    onChange={e => setIsAuction(e.target.value)}
                                >
                                    <MenuItem value="true">Available (Đấu giá)</MenuItem>
                                    <MenuItem value="false">Not Available (Thường)</MenuItem>
                                </TextField>
                            </Grid>                         
                        </Grid>
                        <DialogActions sx={{ mt: 2, px: 0 }}>
                            <Button onClick={handleClose} variant="text" color="secondary">
                                Huỷ
                            </Button>
                            <Button type="submit" variant="contained" color="primary">
                                Lưu thay đổi
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
            </Snackbar>
        </>
    );
}
