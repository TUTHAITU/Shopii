import React from "react";
import axios from "axios";
import BarChart from "../components/charts/BarChart";
import PieChart from "../components/charts/PieChart";
import LineChart from "../components/charts/LineChart";
import Loading from "../components/layout/Loading";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { currentUser, isAuthenticated } = useAuth();

  React.useEffect(() => {
    const getStats = async () => {
      try {
        const response = await axios.get(
          "http://localhost:9999/api/admin/dashboard/stats"
        );
        setStats(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated && currentUser?.role === "admin") getStats();
  }, [isAuthenticated, currentUser]);

  if (!isAuthenticated)
    return (
      <div className="p-4 text-red-500">Please log in to access this page.</div>
    );
  if (loading) return <Loading />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (currentUser && currentUser.role !== "admin")
    return (
      <div className="p-4 text-red-500">
        Access denied. Admin role required.
      </div>
    );

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2>User Statistics</h2>
          <BarChart
            data={[stats.totalUsers, stats.totalSellers, stats.totalProducts]}
            labels={["Total Users", "Total Sellers", "Total Products"]}
          />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2>Order Statistics</h2>
          <PieChart
            data={[stats.totalOrders, stats.pendingStores, stats.openDisputes]}
            labels={["Orders", "Pending Stores", "Open Disputes"]}
          />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2>Review Trends</h2>
          <LineChart data={[stats.totalReviews]} labels={["Reviews"]} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
