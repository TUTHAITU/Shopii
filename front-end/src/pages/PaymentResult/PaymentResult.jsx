import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { resetPayment, checkPaymentStatus } from '../../features/payment/paymentSlice';
import { motion } from 'framer-motion';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  Divider
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HomeIcon from '@mui/icons-material/Home';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [countDown, setCountDown] = useState(5);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState({
    status: '',
    orderId: '',
    message: ''
  });
  
  // Get query parameters from URL
  const query = new URLSearchParams(location.search);
  const queryStatus = query.get('status');
  const queryOrderId = query.get('orderId') || query.get('orderCode');
  const queryMessage = query.get('message');
  const locationState = location.state || {};

  // Check PayOS specific status
  const payosStatus = query.get('status'); // PAID, CANCELLED, etc.
  
  // Ưu tiên sử dụng location state trước, sau đó là query params
  useEffect(() => {
    const getStatusInfo = async () => {
      setIsVerifying(true);
      
      // Sử dụng thông tin từ URL hoặc state
      let finalStatus = locationState.status || queryStatus;
      const orderId = locationState.orderId || queryOrderId;
      const message = locationState.message || queryMessage;
      
      // Đối với PayOS, chúng ta cần dịch trạng thái
      if (payosStatus === 'PAID') {
        finalStatus = 'paid';
      } else if (payosStatus === 'CANCELLED' || payosStatus === 'FAILED') {
        finalStatus = 'failed';
      }
      
      // Nếu có orderId nhưng không có status rõ ràng, kiểm tra với API
      if (orderId && (!finalStatus || finalStatus === 'pending')) {
        try {
          if (token) {
            const resultAction = await dispatch(checkPaymentStatus(orderId));
            if (checkPaymentStatus.fulfilled.match(resultAction)) {
              const data = resultAction.payload;
              if (data?.payment?.status === 'paid') {
                finalStatus = 'paid';
              } else if (data?.payment?.status === 'failed') {
                finalStatus = 'failed';
              }
            }
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
        }
      }
      
      // Set final result
      setPaymentResult({
        status: finalStatus || 'unknown',
        orderId: orderId || '',
        message: message || ''
      });
      
      setIsVerifying(false);
    };
    
    getStatusInfo();
    
    // Reset payment state in Redux
    dispatch(resetPayment());
  }, [dispatch, locationState, queryStatus, queryOrderId, queryMessage, payosStatus, token]);
  
  // Show toast and start countdown after verification
  useEffect(() => {
    if (isVerifying) return;
    
    // Show toast based on status
    if (paymentResult.status === 'paid') {
      toast.success('Thanh toán thành công!');
    } else if (paymentResult.status === 'failed') {
      toast.error('Thanh toán thất bại!');
    } else {
      toast.error(paymentResult.message || 'Đã xảy ra lỗi trong quá trình thanh toán.');
    }
    
    // Start countdown to redirect to home
    const timer = setInterval(() => {
      setCountDown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isVerifying, paymentResult, navigate]);
  
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          {isVerifying ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3, color: '#0F52BA' }} />
              <Typography variant="h5" fontWeight={600}>
                Đang xác minh thanh toán...
              </Typography>
            </Box>
          ) : paymentResult.status === 'paid' ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <CheckCircleOutlineIcon 
                sx={{ 
                  fontSize: 100, 
                  color: '#4CAF50',
                  mb: 2
                }} 
              />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Thanh toán thành công!
              </Typography>
              {paymentResult.orderId && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Mã đơn hàng:
                  </Typography>
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#0F52BA' }}>
                    {paymentResult.orderId}
                  </Typography>
                </Box>
              )}
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 2,
                maxWidth: 400,
                mx: 'auto',
                mb: 4
              }}>
                <Typography variant="body1">
                  Cảm ơn bạn đã mua hàng! Đơn hàng của bạn đã được xử lý thành công.
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <CancelOutlinedIcon 
                sx={{ 
                  fontSize: 100, 
                  color: '#F44336',
                  mb: 2
                }} 
              />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Thanh toán thất bại!
              </Typography>
              {paymentResult.message && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    {paymentResult.message}
                  </Typography>
                </Box>
              )}
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'rgba(244, 67, 54, 0.1)', 
                borderRadius: 2,
                maxWidth: 400,
                mx: 'auto',
                mb: 4
              }}>
                <Typography variant="body1">
                  Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ khách hàng.
                </Typography>
              </Box>
            </motion.div>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          {!isVerifying && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
              <CircularProgress 
                variant="determinate" 
                value={(countDown / 5) * 100} 
                size={24} 
                sx={{ mr: 2, color: '#0F52BA' }} 
              />
              <Typography variant="body1" color="text.secondary">
                Bạn sẽ được chuyển đến trang chủ trong <strong>{countDown}</strong> giây
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ 
                backgroundColor: '#0F52BA',
                '&:hover': {
                  backgroundColor: '#0A3C8A',
                },
                px: 3,
                py: 1.2
              }}
            >
              Về trang chủ
            </Button>
            
            {paymentResult.status === 'paid' && (
              <Button
                variant="outlined"
                startIcon={<ReceiptLongIcon />}
                component={Link}
                to="/order-history"
                sx={{ 
                  borderColor: '#0F52BA',
                  color: '#0F52BA',
                  '&:hover': {
                    borderColor: '#0A3C8A',
                    backgroundColor: 'rgba(15, 82, 186, 0.04)',
                  },
                  px: 3,
                  py: 1.2
                }}
              >
                Xem đơn hàng
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default PaymentResult; 