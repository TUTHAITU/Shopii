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
// import About from "./pages/About/About";
// import SignIn from "./pages/Account/SignIn";
// import SignUp from "./pages/Account/SignUp";
// import Cart from "./pages/Cart/Cart";
// import Contact from "./pages/Contact/Contact";
// import Home from "./pages/Home/Home";
// import Journal from "./pages/Journal/Journal";
// import Offer from "./pages/Offer/Offer";
// import Payment from "./pages/payment/Payment";
// import ProductDetails from "./pages/ProductDetails/ProductDetails";
// import Shop from "./pages/Shop/Shop";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManagerDashboardLaydout from "./pages/Dashboard/ManagerDashboardLaydout";
// import AdminDashboardLaydout from "./pages/Dashboard/AdminDashboardLaydout";
import ManageProduct from "./pages/Dashboard/ManageProduct/ManageProduct";
import ProductDetail from "./pages/Dashboard/ManageProduct/ProductDetail";
import ManageStoreProfile from "./pages/Dashboard/ManageStoreProfile/ManageStoreProfile";
// import ManageAccount from "./pages/Dashboard/ManageAccount/ManageAccount"
// import ForgotPassword from "./pages/Account/ForgotPassword";
// import ResendVerificationEmail from "./pages/Account/ResendVerificationEmail";
// import ResetPassword from "./pages/Account/ResetPassword";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCart } from "./redux/slices/cart.slice";
// import Checkout from "./pages/Checkout/checkout";
// import MyOrders from "./pages/MyOrder/MyOrders";
// import Profile from "./pages/Profile/Profile";
// import ManageOrder from './pages/Dashboard/ManageOrder/ManageOrder';
// import CreateOrder from "./pages/Dashboard/ManageOrder/CreateOrder";
// import EditOrder from "./pages/Dashboard/ManageOrder/EditOrder";
// import VnpayReturnHandler from "./pages/Thank/VnpayReturnHandler";
// import VerifyEmail from "./pages/Account/VerifyEmail";
// import ErrorPage from "./pages/ErrorPage/ErrorPage";
// import MyProfile from "./pages/Dashboard/MyProfile/MyProfile";
// import ManageProfit from "./pages/Dashboard/ManageProfit/ManageProfit";
// import PayOSReturnHandler from "./pages/Thank/PayOSReturnHandler";
// import CancelReturnHandler from "./pages/Thank/CancelReturnHandler";
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
        <Route path="/manage-product" element={<ManageProduct />}></Route>
        <Route path="/manage-store" element={<ManageStoreProfile />}></Route>
        <Route path="/product/:id" element={<ProductDetail />} />
        {/* <Route path="/manage-order" element={<ManageOrder />}></Route>
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

