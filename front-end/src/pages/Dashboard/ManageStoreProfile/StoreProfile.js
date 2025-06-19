import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Chip,
    CircularProgress,
    Stack,
    Grid
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import axios from 'axios';

export default function StoreProfile() {
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:9999/api/seller/store?skipAuth=true')
            .then(res => setStore(res.data.data))
            .catch(() => setStore(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <CircularProgress sx={{ m: 3 }} />;
    }

    if (!store) {
        return (
            <Typography color="text.secondary">You have no store yet.</Typography>
        );
    }

    const seller = store.sellerId;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Store Profile
            </Typography>
            <Card sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 2 }}>
                <Avatar
                    variant="rounded"
                    src={store.bannerImageURL}
                    sx={{ width: 80, height: 80, mr: 3, border: "2px solid #1976d2" }}
                >
                    <StorefrontIcon fontSize="large" />
                </Avatar>
                <CardContent sx={{ flex: 1, p: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        {store.storeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {store.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Chip
                            size="small"
                            label={store.status}
                            color={
                                store.status === 'approved'
                                    ? 'success'
                                    : store.status === 'pending'
                                        ? 'warning'
                                        : 'error'
                            }
                        />
                        <Typography variant="caption" color="text.secondary">
                            <strong>Store ID:</strong> {store._id}
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>

            {/* Seller Profile */}
            <Typography variant="h5" gutterBottom>
                Seller Profile
            </Typography>
            <Card sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 2 }}>
                <Avatar
                    src={seller.avatarURL}
                    sx={{ width: 60, height: 60, mr: 3, bgcolor: 'grey.200' }}
                >
                    <PersonIcon fontSize="large" />
                </Avatar>
                <CardContent sx={{ flex: 1, p: 1 }}>
                    {/* <Typography variant="subtitle1" gutterBottom>
            <strong>Seller Profile</strong>
          </Typography> */}
                    <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                                <strong>Username:</strong> {seller.username}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Full name:</strong> {seller.fullname}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Email:</strong> <EmailIcon fontSize="small" sx={{ mb: '-3px' }} /> {seller.email}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Password:</strong>{" "}
                                {seller.password ? "•".repeat(seller.password.length) : "••••••••"}
                            </Typography>

                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                                <strong>Role:</strong> {seller.role}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Status:</strong> {seller.action}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Seller ID:</strong> {seller._id}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
