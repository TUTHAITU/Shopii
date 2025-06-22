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
import SpecialCase from "./components/SpecialCase/SpecialCase";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManagerDashboardLaydout from "./pages/Dashboard/ManagerDashboardLaydout";
import ManageProduct from "./pages/Dashboard/ManageProduct/ManageProduct";
import ProductDetail from "./pages/Dashboard/ManageProduct/ProductDetail";
import ManageStoreProfile from "./pages/Dashboard/ManageStoreProfile/ManageStoreProfile";
import ManageInventory from "./pages/Dashboard/ManageProduct/ManageInventory";
import ManageOrder from "./pages/Dashboard/ManageOrder/ManageOrderHistory";
import ManageDispute from "./pages/Dashboard/ManageDispute/ManageDispute";
import ManageReturnRequest from "./pages/Dashboard/ManageReturnRequest/ManageReturnRequest";
import Overview from "./pages/Dashboard/Overview/Overview";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCart } from "./redux/slices/cart.slice";

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
      <SpecialCase />
      <ScrollRestoration />
      <Outlet />
      <Footer />
      <FooterBottom />
    </div>
  );
};
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* <Route path="/" element={<Layout />}>
  
        <Route index element={<Home />}></Route>
        <Route path="/shop" element={<Shop />}></Route>
        <Route path="/about" element={<About />}></Route>
        <Route path="/contact" element={<Contact />}></Route>
        <Route path="/journal" element={<Journal />}></Route>
        
        <Route path="/category/:category" element={<Offer />}></Route>
        <Route path="/product/:_id" element={<ProductDetails />}></Route>
        <Route path="/cart" element={<Cart />}></Route>
        <Route path="/checkout" element={<Checkout />}></Route>
        <Route path="/paymentgateway" element={<Payment />}></Route>
        <Route path="/vnpay_return_url" element={<VnpayReturnHandler />}></Route>
        <Route path="/success" element={<PayOSReturnHandler />}></Route>
        <Route path="/cancel" element={<CancelReturnHandler />}></Route>
        <Route path="/order-history" element={<MyOrders />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/verify-email" element={<VerifyEmail />}></Route>
      </Route> */}
      <Route path="/" element={<ManagerDashboardLaydout />}>
        <Route path="/" element={<Overview />}></Route>
        <Route path="/manage-product" element={<ManageProduct />}></Route>
        <Route path="/manage-inventory" element={<ManageInventory />} />
        <Route path="/manage-store" element={<ManageStoreProfile />}></Route>
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/manage-order" element={<ManageOrder />}></Route>
        <Route path="/manage-dispute" element={<ManageDispute />} />
        <Route path="/manage-return-request" element={<ManageReturnRequest />} />
        {/* 
        <Route path="/create-order" element={<CreateOrder />}></Route>
        <Route path="/my-profile" element={<MyProfile />}></Route>
        <Route path="/update-order/:orderId" element={<EditOrder />}></Route> */}
      </Route>
      {/* <Route path="/" element={<AdminDashboardLaydout />}>
        <Route path="/manage-account" element={<ManageAccount />}></Route>
        <Route path="/manage-profit" element={<ManageProfit />}></Route>
      </Route>
      <Route path="/signup" element={<SignUp />}></Route>
      <Route path="/signin" element={<SignIn />}></Route>
      <Route path="/forgot-password" element={<ForgotPassword />}></Route>
      <Route path="/reset-password/:token" element={<ResetPassword />}></Route>
      <Route path="/resend-verification-email" element={<ResendVerificationEmail />}></Route>
      <Route path="/error" element={<ErrorPage />} /> */}
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

