// store.js (updated)
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '../features/auth/authSlice';
import productsReducer from '../features/products/productsSlice';
import cartReducer from '../features/cart/cartSlice';
import addressReducer from '../features/address/addressSlice';
import voucherReducer from '../features/voucher/voucherSlice';
import orderSlice from './../features/order/orderSlice';
import paymentReducer from '../features/payment/paymentSlice'; // Add this import

const persistConfig = {
  key: 'root',
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

const initialCartState = {
  items: [],
  loading: false,
  error: null
};

const cartReducerWithInitial = (state = initialCartState, action) => {
  return cartReducer(state, action);
};

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    products: productsReducer,
    cart: cartReducerWithInitial,
    address: addressReducer,
    voucher: voucherReducer,
    order: orderSlice,
    payment: paymentReducer, // Add this line
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

export default { store, persistor };