import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [], // Khởi tạo mảng rỗng
  loading: false,
  error: null
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess(state, action) {
      state.products = action.payload;
      state.loading = false;
    },
    fetchProductsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const { 
  fetchProductsStart, 
  fetchProductsSuccess, 
  fetchProductsFailure 
} = productsSlice.actions;

export default productsSlice.reducer;