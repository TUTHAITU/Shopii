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
  TextField,
  Button,
} from "@mui/material";
import axios from "axios";

// Hàm group các reply vào đúng review gốc dựa vào parentId
function groupReviews(flatReviews) {
  const reviewsById = {};
  flatReviews.forEach(r => reviewsById[r._id] = { ...r, replies: [] });

  const roots = [];
  flatReviews.forEach(r => {
    if (r.parentId) {
      // Nếu là reply
      if (reviewsById[r.parentId]) {
        reviewsById[r.parentId].replies.push(reviewsById[r._id]);
      }
    } else {
      // Là review gốc
      roots.push(reviewsById[r._id]);
    }
  });

  return roots;
}

const ProductDetail = () => {
  const { id } = useParams();
  const [productDetail, setProductDetail] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho reply
  const [replyTexts, setReplyTexts] = useState({});
  const [postingReply, setPostingReply] = useState({});
  const [errorReply, setErrorReply] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy chi tiết sản phẩm
        const res = await axios.get(
          `http://localhost:9999/api/admin/products/${id}?skipAuth=true`
        );
        setProductDetail(res.data.data[0]);

        // Lấy danh sách review (gồm cả review gốc và reply, có parentId)
        const resReview = await axios.get(
          `http://localhost:9999/api/admin/products/${id}/reviews?skipAuth=true`
        );
        // Group lại để reply nằm đúng dưới review gốc
        const grouped = groupReviews(resReview.data.data || []);
        setReviews(grouped);
      } catch (err) {
        setProductDetail(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Xử lý nhập text reply
  const handleReplyChange = (reviewId, value) => {
    setReplyTexts((prev) => ({ ...prev, [reviewId]: value }));
  };

  // Submit reply & update tại chỗ (không reload lại reviews)
  const handleSubmitReply = async (reviewId) => {
    const comment = (replyTexts[reviewId] || "").trim();
    if (!comment) return;
    setPostingReply((prev) => ({ ...prev, [reviewId]: true }));
    setErrorReply((prev) => ({ ...prev, [reviewId]: "" }));

    try {
      // Gửi reply, backend trả về reply object
      const res = await axios.post(
        `http://localhost:9999/api/admin/products/${id}/reviews/${reviewId}/reply?skipAuth=true`,
        { comment }
      );
      const reply = res.data.data; // object trả về từ backend

      // Chèn reply này vào đúng review, không reload hết
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev._id === reviewId) {
            const newReplies = rev.replies ? [...rev.replies, reply] : [reply];
            return { ...rev, replies: newReplies };
          }
          return rev;
        })
      );
      setReplyTexts((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (err) {
      setErrorReply((prev) => ({
        ...prev,
        [reviewId]:
          err?.response?.data?.message ||
          "Failed to reply. Please try again.",
      }));
    }
    setPostingReply((prev) => ({ ...prev, [reviewId]: false }));
  };

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
              {productDetail.productId.isAuction ? "Available" : "Not Available"}
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
              {/* Hiển thị replies (của stores) dưới review gốc */}
              {review.replies && review.replies.length > 0 && (
                <Stack spacing={1} pl={6} mt={1}>
                  {review.replies.map((reply) => (
                    <Paper
                      key={reply._id}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: "#eaf3fa",
                        borderLeft: "3px solid #0288d1",
                      }}
                    >
                      <Grid container spacing={1} alignItems="center">
                        <Grid item>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {reply.storeName?.[0]?.toUpperCase() || "S"}
                          </Avatar>
                        </Grid>
                        <Grid item xs>
                          <Typography fontWeight="bold">
                            {reply.storeName || "Store"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {reply.comment}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reply.createdAt
                              ? new Date(reply.createdAt).toLocaleString()
                              : ""}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
              {/* Form trả lời review của admin */}
              <Box mt={1.5}>
                <TextField
                  value={replyTexts[review._id] || ""}
                  onChange={(e) => handleReplyChange(review._id, e.target.value)}
                  placeholder="Reply to this review as Store/admin..."
                  size="small"
                  multiline
                  minRows={1}
                  maxRows={3}
                  sx={{ width: "100%" }}
                  disabled={postingReply[review._id]}
                />
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                  disabled={
                    postingReply[review._id] ||
                    !(replyTexts[review._id] || "").trim()
                  }
                  onClick={() => handleSubmitReply(review._id)}
                >
                  Reply
                </Button>
                {errorReply[review._id] && (
                  <Typography color="error" variant="caption">
                    {errorReply[review._id]}
                  </Typography>
                )}
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default ProductDetail;
