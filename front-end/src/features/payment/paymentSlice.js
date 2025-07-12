// paymentSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';

export const createPayment = createAsyncThunk(
  'payment/createPayment',
  async (paymentData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      const response = await axios.post(`${API_URL}/buyers/payments`, paymentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    payment: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetPayment: (state) => {
      state.payment = null;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payment = action.payload;
        state.success = true;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;