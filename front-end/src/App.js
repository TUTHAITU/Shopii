import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  createRoutesFromElements,
  Route,
  ScrollRestoration,
} from "react-router-dom";
import Footer from "./components/home/Footer/Footer";
import FooterBottom from "./components/home/Footer/FooterBottom";
import Header from "./components/home/Header/Header";
import HeaderBottom from "./components/home/Header/HeaderBottom";
import SpecialCase from "./components/SpecialCase/SpiecialCase.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManagerDashboardSellerLaydout from "./pages/DashboardSeller/ManagerDashboardSellerLaydout";
import ManageProduct from "./pages/DashboardSeller/ManageProduct/ManageProduct";
import ProductDetail from "./pages/DashboardSeller/ManageProduct/ProductDetail";
import ManageStoreProfile from "./pages/DashboardSeller/ManageStoreProfile/ManageStoreProfile";
import ManageInventory from "./pages/DashboardSeller/ManageProduct/ManageInventory";
import ManageOrder from "./pages/DashboardSeller/ManageOrder/ManageOrderHistory";
import ManageDispute from "./pages/DashboardSeller/ManageDispute/ManageDispute";
import ManageReturnRequest from "./pages/DashboardSeller/ManageReturnRequest/ManageReturnRequest";
import ManageShipping from "./pages/DashboardSeller/ManageShipping/ManageShipping";
import Overview from "./pages/DashboardSeller/Overview/Overview";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCart } from "./redux/slices/cart.slice";

import { Provider } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';

import SignIn from "./pages/SignIn.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

import Home from './pages/Home.jsx';
import Cart from "./pages/Cart/Cart";

import Checkout from "./pages/Checkout/Checkout";
import Address from './pages/Address/Address';
import SignUp from './pages/SignUp';
import Payment from './pages/Payment/Payment';
import PaymentResult from './pages/PaymentResult/PaymentResult';
import StoreRegistration from './pages/StoreRegistration';


const Layout = () => {
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Header />
      <HeaderBottom />
      {/* <SpecialCase /> */}
      <ScrollRestoration />
      <Outlet />
      <Footer />
      <FooterBottom />
    </div>
  );
};
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorPage />}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />}></Route> {/* Trang chủ cho buyer */}
        <Route path="/cart" element={<Cart />}></Route>
        <Route path="/checkout" element={<Checkout />}></Route>
        <Route path="/address" element={<Address />}></Route>
        <Route path="/payment" element={<Payment />}></Route>
        <Route path="/payment-result" element={<PaymentResult />}></Route>
        <Route path="/profile" element={<div className="w-full my-10 px-4">
          <h1 className="text-2xl font-bold mb-4">User Profile</h1>
          <p className="text-gray-600">Profile page is coming soon.</p>
        </div>}></Route>
      </Route>
      
      <Route path="/" element={<ManagerDashboardSellerLaydout />} errorElement={<ErrorPage />}>
        <Route path="overview" element={<Overview />}></Route>
        <Route path="manage-product" element={<ManageProduct />}></Route>
        <Route path="manage-inventory" element={<ManageInventory />} />
        <Route path="manage-store" element={<ManageStoreProfile />}></Route>
        <Route path="product/:id" element={<ProductDetail />} errorElement={<ErrorPage />} />
        <Route path="manage-order" element={<ManageOrder />}></Route>
        <Route path="manage-shipping" element={<ManageShipping />}></Route>
        <Route path="manage-dispute" element={<ManageDispute />} />
        <Route path="manage-return-request" element={<ManageReturnRequest />} />
      </Route>

      <Route path="/signin" element={<SignIn />}></Route>
      <Route path="/signup" element={<SignUp />}></Route>
      <Route path="/store-registration" element={<StoreRegistration />}></Route>
      <Route path="/forgot-password" element={<ForgotPassword />}></Route>
      <Route path="*" element={<ErrorPage />} />
    </Route>
  )
);

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchCart());

  }, [dispatch]);

  return (
    <div className="font-bodyFont">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

