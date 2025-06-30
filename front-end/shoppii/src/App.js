import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// Pages and Components
import Dashboard from "./pages/Dashboard";
import AdminUsersList from "./components/users/AdminUsersList";
import UserForm from "./components/users/UserForm";
import AdminStoresList from "./components/stores/AdminStoresList";
import StoreStatusForm from "./components/stores/StoreStatusForm";
import AdminCategoriesList from "./components/categories/AdminCategoriesList";
import CategoryForm from "./components/categories/CategoryForm";
import AdminDisputesList from "./components/disputes/AdminDisputesList";
import DisputeForm from "./components/disputes/DisputeForm";
import AdminProductsList from "./components/products/AdminProductsList";
import ProductDelete from "./components/products/ProductDelete";
import AdminOrdersList from "./components/orders/AdminOrdersList";
import OrderDetails from "./components/orders/OrderDetails";
import OrderStatusForm from "./components/orders/OrderStatusForm";
import AdminReviewsList from "./components/reviews/AdminReviewsList";
import ReviewDelete from "./components/reviews/ReviewDelete";
import AdminFeedbackList from "./components/feedback/AdminFeedbackList";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && currentUser?.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminUsersList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/edit/:userId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminStoresList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/status"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <StoreStatusForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminCategoriesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories/edit/:categoryId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <CategoryForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories/create"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <CategoryForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/disputes"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDisputesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/disputes/:disputeId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <DisputeForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/products"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminProductsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/delete/:productId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ProductDelete />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminOrdersList /> 
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:orderId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <OrderDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:orderId/status"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <OrderStatusForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminReviewsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews/delete/:reviewId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ReviewDelete />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminFeedbackList />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
