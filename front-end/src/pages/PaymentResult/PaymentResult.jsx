import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { resetPayment } from '../../features/payment/paymentSlice';
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
  const [countDown, setCountDown] = useState(5);
  
  // Get query parameters from URL
  const query = new URLSearchParams(location.search);
  const status = query.get('status') || location.state?.status;
  const orderId = query.get('orderId') || location.state?.orderId;
  const message = query.get('message') || location.state?.message;
  
  useEffect(() => {
    // Reset payment state in Redux
    dispatch(resetPayment());
    
    // Show toast based on status
    if (status === 'paid') {
      toast.success('Payment successful!');
    } else if (status === 'failed') {
      toast.error('Payment failed!');
    } else {
      toast.error(message || 'An error occurred during payment.');
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
  }, [status, message, dispatch, navigate]);
  
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
          {status === 'paid' ? (
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
                Payment Successful!
              </Typography>
              {orderId && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Order ID:
                  </Typography>
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#0F52BA' }}>
                    {orderId}
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
                  Thank you for your purchase! Your order has been successfully processed.
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
                Payment Failed!
              </Typography>
              {message && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    {message}
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
                  Something went wrong with your payment. Please try again or contact customer support.
                </Typography>
              </Box>
            </motion.div>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
            <CircularProgress 
              variant="determinate" 
              value={(countDown / 5) * 100} 
              size={24} 
              sx={{ mr: 2, color: '#0F52BA' }} 
            />
            <Typography variant="body1" color="text.secondary">
              You will be redirected to the home page in <strong>{countDown}</strong> seconds
            </Typography>
          </Box>
          
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
              Go to Home
            </Button>
            
            {status === 'paid' && (
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
                View Orders
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default PaymentResult; 