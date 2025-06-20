import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Avatar,
  CircularProgress,
  Rating,
  Stack,
} from "@mui/material";
import axios from "axios";

const ProductDetail = () => {
  const { id } = useParams();
  const [productDetail, setProductDetail] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch product info & reviews
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy chi tiết sản phẩm (join inventory, category, seller)
        const res = await axios.get(
          `http://localhost:9999/api/seller/products/${id}?skipAuth=true`
        );
        // productDetail trả về là 1 object (nếu theo gợi ý controller trước)
        setProductDetail(res.data.data[0]);

        // Lấy review của sản phẩm
        const resReview = await axios.get(
          `http://localhost:9999/api/seller/products/${id}/reviews?skipAuth=true`
        );
        setReviews(resReview.data.data || []);
      } catch (err) {
        setProductDetail(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading)
    return (
      <Box p={5} textAlign="center">
        <CircularProgress />
      </Box>
    );
  if (!productDetail || !productDetail.productId)
    return (
      <Typography color="error" variant="h5" sx={{ m: 6, textAlign: "center" }}>
        Product not found!
      </Typography>
    );

  return (
    <Box maxWidth="900px" mx="auto" mt={4}>
   <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <img
          src={productDetail.productId.image}
          alt={productDetail.productId.title}
          style={{
            width: "100%",
            borderRadius: 16,
            objectFit: "cover",
            minHeight: 260,
            background: "#eee",
          }}
        />
      </Grid>
      <Grid item xs={12} md={7}>
        <Typography variant="h4" fontWeight="bold" mb={2}>
          {productDetail.productId.title}
        </Typography>
        <Typography color="text.secondary" mb={1}>
          <b>Category:</b> {productDetail.productId.categoryId?.name || "N/A"}
        </Typography>
        <Typography color="success.main" variant="h5" mb={1}>
          ${productDetail.productId.price}
        </Typography>
        <Typography variant="body1" mb={2}>
          <b>Description:</b> {productDetail.productId.description}
        </Typography>
        <Typography variant="body2" mb={1}>
          <b>Status:</b>{" "}
          {productDetail.productId.isAuction ? "Action" : "Normal"}
        </Typography>
        <Typography variant="body2" mb={1}>
          <b>In Stock:</b> {productDetail.quantity}
        </Typography>
        <Typography variant="body2" mb={1}>
          <b>Last Updated Stock:</b>{" "}
          {productDetail.updatedAt
            ? new Date(productDetail.updatedAt).toLocaleString()
            : "N/A"}
        </Typography>
      </Grid>
    </Grid>
  </Paper>

      {/* Reviews */}
      <Box mt={6}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Product Reviews
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {reviews.length === 0 && (
          <Typography color="text.secondary">
            No reviews for this product yet.
          </Typography>
        )}
        <Stack spacing={2}>
          {reviews.map((review) => (
            <Paper
              key={review._id}
              elevation={1}
              sx={{ p: 2, borderRadius: 2, background: "#f9f9f9" }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Avatar>
                    {review.reviewerId?.username?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography fontWeight="bold">
                    {review.reviewerId?.username || "User"}
                  </Typography>
                  <Rating
                    value={review.rating || 0}
                    readOnly
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {review.comment}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleString()
                      : ""}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default ProductDetail;
