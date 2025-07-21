// Payment.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createPayment, resetPayment, checkPaymentStatus } from "../../features/payment/paymentSlice";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  Box, 
  Container, 
  Typography, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  Button, 
  Paper, 
  Divider, 
  CircularProgress,
  Grid
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import QrCodeIcon from "@mui/icons-material/QrCode";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const payosIframeRef = useRef(null);

  const { orderId, totalPrice } = location.state || {
    orderId: null,
    totalPrice: 0
  };

  // Đảm bảo totalPrice là số nguyên cho các API thanh toán
  const formattedPrice = Number(totalPrice).toFixed(2);
  const roundedPrice = Math.round(totalPrice);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD');
  const [showPayosIframe, setShowPayosIframe] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  const { payment, paymentStatus, loading, error, success } = useSelector((state) => state.payment);
  const { token } = useSelector((state) => state.auth);

  // Hàm kiểm tra trạng thái thanh toán
  const checkPaymentStatusHandler = async () => {
    try {
      // Dispatch action kiểm tra trạng thái
      const resultAction = await dispatch(checkPaymentStatus(orderId));
      if (checkPaymentStatus.fulfilled.match(resultAction)) {
        const data = resultAction.payload;
        const status = data?.payment?.status;
        
        if (status === 'paid') {
          clearPolling();
          toast.success("Thanh toán thành công!");
          navigate('/payment-result', { 
            state: { status: 'paid', orderId: orderId },
            replace: true 
          });
        } else if (status === 'failed') {
          clearPolling();
          toast.error("Thanh toán thất bại!");
          navigate('/payment-result', { 
            state: { status: 'failed', orderId: orderId },
            replace: true 
          });
        }
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra trạng thái thanh toán:", err);
    }
  };

  // Hàm xóa interval polling
  const clearPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setPaymentPolling(false);
    }
  };

  // Khởi tạo polling
  const startPaymentPolling = () => {
    // Xóa polling cũ nếu có
    clearPolling();
    
    // Tạo polling mới
    setPaymentPolling(true);
    const interval = setInterval(() => {
      checkPaymentStatusHandler();
    }, 5000); // Check every 5 seconds
    
    setPollingInterval(interval);
  };
  
  // Xóa polling khi component unmount
  useEffect(() => {
    return () => clearPolling();
  }, []);

  // Polling for payment status
  useEffect(() => {
    if (success && (selectedPaymentMethod === 'VietQR' || selectedPaymentMethod === 'PayOS')) {
      if ((selectedPaymentMethod === 'VietQR' && payment?.qrData?.qrDataURL) || 
          (selectedPaymentMethod === 'PayOS' && payment?.paymentUrl)) {
        startPaymentPolling();
      }
    }
  }, [success, selectedPaymentMethod, payment]);

  useEffect(() => {
    if (success) {
      if (selectedPaymentMethod === 'VietQR') {
        if (payment?.qrData?.qrDataURL) {
          toast.success("Mã QR đã được tạo. Vui lòng quét mã để hoàn tất thanh toán.");
        } else {
          console.error("Phản hồi VietQR thiếu dữ liệu QR:", payment);
          toast.error("Không thể tạo mã QR. Vui lòng thử phương thức thanh toán khác.");
          dispatch(resetPayment());
        }
      } else if (selectedPaymentMethod === 'PayOS') {
        if (payment?.paymentUrl) {
          setShowPayosIframe(true);
          toast.success("Cổng thanh toán PayOS đã mở");
        } else {
          console.error("Phản hồi PayOS thiếu URL thanh toán:", payment);
          toast.error("Không thể tạo liên kết thanh toán PayOS");
          dispatch(resetPayment());
        }
      } else if (selectedPaymentMethod === 'COD') {
        toast.success("Đã tạo đơn hàng thanh toán khi nhận hàng thành công.");
        setTimeout(() => {
          navigate('/payment-result', { 
            state: { status: 'paid', orderId: orderId },
            replace: true 
          });
        }, 2000);
      }
    }

    if (error) {
      toast.error(error);
      dispatch(resetPayment());
    }
  }, [success, error, payment, selectedPaymentMethod, dispatch, orderId, navigate]);

  if (!orderId) {
    toast.error("Order information not found.");
    navigate("/");
    return null;
  }

  // Handle QR code loading error
  const handleQrImageError = () => {
    console.error("Error loading VietQR image");
    toast.error("QR image failed to load. Please try another payment method.");
    setPaymentPolling(false);
    dispatch(resetPayment());
  };

  // Handle PayOS iframe loading error
  const handlePayOsIframeError = () => {
    console.error("Error loading PayOS payment iframe");
    toast.error("Payment gateway failed to load. Please try another payment method.");
    setShowPayosIframe(false);
    dispatch(resetPayment());
  };

  const handlePayment = () => {
    if (selectedPaymentMethod === 'VietQR') {
      toast.info("Generating QR code for payment...");
    } else if (selectedPaymentMethod === 'PayOS') {
      toast.info("Opening payment gateway...");
    }
    dispatch(createPayment({ orderId, method: selectedPaymentMethod }));
  };

  // Xử lý khi đóng cổng thanh toán
  const handleBackToHome = () => {
    setShowPayosIframe(false);
    clearPolling();
    dispatch(resetPayment());
    navigate("/");
  };

  // Open PayOS payment page in new tab
  const openPaymentPage = () => {
    if (payment?.paymentUrl) {
      window.open(payment.paymentUrl, '_blank');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: '#0F52BA',
            position: 'relative',
            pb: 2,
            mb: 4,
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '60px',
              height: '4px',
              backgroundColor: '#0F52BA',
              borderRadius: '2px'
            }
          }}
        >
          <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Select Payment Method
        </Typography>
        
        {showPayosIframe && payment?.paymentUrl ? (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              maxWidth: 800,
              mx: 'auto',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h5" fontWeight={600} mb={3}>
              PayOS Payment
            </Typography>
            <Box 
              sx={{ 
                height: "600px", 
                border: '1px solid #eaeaea',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 3
              }}
            >
              <iframe 
                ref={payosIframeRef}
                src={payment.paymentUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none"
                }}
                title="PayOS Payment"
                allow="payment"
                onError={handlePayOsIframeError}
              />
            </Box>
            <Grid container spacing={2} justifyContent="space-between">
              <Grid item>
                <Button
                  variant="contained"
                  onClick={openPaymentPage}
                  startIcon={<PaymentIcon />}
                  sx={{ 
                    backgroundColor: '#0F52BA',
                    '&:hover': {
                      backgroundColor: '#0A3C8A',
                    },
                    px: 3,
                    py: 1
                  }}
                >
                  Open in new tab
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={handleBackToHome}
                  startIcon={<HomeIcon />}
                  sx={{ 
                    borderColor: '#0F52BA',
                    color: '#0F52BA',
                    '&:hover': {
                      borderColor: '#0A3C8A',
                      backgroundColor: 'rgba(15, 82, 186, 0.04)',
                    },
                    px: 3,
                    py: 1
                  }}
                >
                  Return to home
                </Button>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  borderRadius: 2,
                  height: '100%',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              >
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Choose Payment Method
                </Typography>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2,
                        borderColor: selectedPaymentMethod === 'COD' ? '#0F52BA' : 'divider',
                        backgroundColor: selectedPaymentMethod === 'COD' ? 'rgba(15, 82, 186, 0.04)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FormControlLabel 
                        value="COD" 
                        control={<Radio sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }} />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocalAtmIcon sx={{ mr: 1, color: '#0F52BA' }} />
                            <Typography>Cash on Delivery (COD)</Typography>
                          </Box>
                        }
                        sx={{ width: '100%' }}
                      />
                    </Paper>
                    
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2,
                        borderColor: selectedPaymentMethod === 'VietQR' ? '#0F52BA' : 'divider',
                        backgroundColor: selectedPaymentMethod === 'VietQR' ? 'rgba(15, 82, 186, 0.04)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FormControlLabel 
                        value="VietQR" 
                        control={<Radio sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }} />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <QrCodeIcon sx={{ mr: 1, color: '#0F52BA' }} />
                            <Typography>VietQR Payment</Typography>
                          </Box>
                        }
                        sx={{ width: '100%' }}
                      />
                    </Paper>
                    
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2,
                        borderColor: selectedPaymentMethod === 'PayOS' ? '#0F52BA' : 'divider',
                        backgroundColor: selectedPaymentMethod === 'PayOS' ? 'rgba(15, 82, 186, 0.04)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FormControlLabel 
                        value="PayOS" 
                        control={<Radio sx={{ color: '#0F52BA', '&.Mui-checked': { color: '#0F52BA' } }} />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PaymentIcon sx={{ mr: 1, color: '#0F52BA' }} />
                            <Typography>PayOS</Typography>
                          </Box>
                        }
                        sx={{ width: '100%' }}
                      />
                    </Paper>
                  </RadioGroup>
                </FormControl>
                
                {success && selectedPaymentMethod === 'VietQR' && payment?.qrData?.qrDataURL && (
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                      Scan QR Code to Pay
                    </Typography>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 3, 
                        display: 'inline-block', 
                        borderRadius: 2,
                        backgroundColor: 'white'
                      }}
                    >
                      <Box sx={{ position: 'relative', width: '250px', height: '250px' }}>
                        <img 
                          src={payment.qrData.qrDataURL} 
                          alt="VietQR Code" 
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                          onError={handleQrImageError}
                        />
                      </Box>
                    </Paper>
                    {paymentPolling && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1, color: '#0F52BA' }} />
                        <Typography variant="body2" color="text.secondary">
                          Waiting for payment confirmation...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
                
                {!success && (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handlePayment}
                    disabled={loading}
                    sx={{ 
                      mt: 3, 
                      py: 1.5,
                      backgroundColor: '#0F52BA',
                      '&:hover': {
                        backgroundColor: '#0A3C8A',
                      },
                      fontWeight: 600
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>
                )}
                
                {success && (
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    onClick={handleBackToHome}
                    startIcon={<HomeIcon />}
                    sx={{ 
                      mt: 3,
                      py: 1.5,
                      borderColor: '#0F52BA',
                      color: '#0F52BA',
                      '&:hover': {
                        borderColor: '#0A3C8A',
                        backgroundColor: 'rgba(15, 82, 186, 0.04)',
                      },
                      fontWeight: 600
                    }}
                  >
                    Return to Home
                  </Button>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  borderRadius: 2,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              >
                <Typography variant="h5" fontWeight={600} mb={3}>
                  Order Summary
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" color="text.secondary">Order ID:</Typography>
                    <Typography variant="body1" fontWeight={500}>{orderId}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" fontWeight={700} color="#0F52BA">
                      ${formattedPrice}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(15, 82, 186, 0.04)', 
                  borderRadius: 2,
                  border: '1px dashed #0F52BA'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    By proceeding with this payment, you agree to our terms and conditions. 
                    For Cash on Delivery orders, please have the exact amount ready at the time of delivery.
                  </Typography>
                </Box>
              </Paper>
              
              <Button
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ 
                  mt: 2,
                  color: '#0F52BA',
                  '&:hover': {
                    backgroundColor: 'rgba(15, 82, 186, 0.04)',
                  }
                }}
              >
                Back to Checkout
              </Button>
            </Grid>
          </Grid>
        )}
      </motion.div>
    </Container>
  );
};

export default Payment;