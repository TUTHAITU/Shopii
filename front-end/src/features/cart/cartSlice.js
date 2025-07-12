import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      const response = await axios.get(`${API_URL}/buyers/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.items;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      await axios.put(
        `${API_URL}/buyers/cart/update/${productId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { productId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      await axios.delete(`${API_URL}/buyers/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove cart item');
    }
  }
);

export const resetCart = createAsyncThunk(
  'cart/resetCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      const state = getState();
      const items = state.cart.items;
      await Promise.all(
        items.map(item => 
          axios.delete(`${API_URL}/buyers/cart/remove/${item.productId._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset cart');
    }
  }
);
export const removeSelectedItems = createAsyncThunk(
  'cart/removeSelectedItems',
  async (productIds, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Gửi yêu cầu xóa từng sản phẩm
      await Promise.all(
        productIds.map(productId => 
          axios.delete(`${API_URL}/buyers/cart/remove/${productId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      
      return productIds;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove selected items');
    }
  }
);
// Thêm initial state
const initialState = {
  items: [],
  loading: false,
  error: null
};
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { productId, quantity } = action.payload;
        const itemIndex = state.items.findIndex(item => item.productId._id === productId);
        if (itemIndex !== -1) {
          state.items[itemIndex].quantity = quantity;
        }
        state.loading = false;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        const productId = action.payload;
        state.items = state.items.filter(item => item.productId._id !== productId);
        state.loading = false;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetCart.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
      })
      .addCase(resetCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeSelectedItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSelectedItems.fulfilled, (state, action) => {
        const removedIds = action.payload;
        state.items = state.items.filter(item => !removedIds.includes(item.productId._id));
        state.loading = false;
      })
      .addCase(removeSelectedItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default cartSlice.reducer;