const User = require("./User");
const Address = require("./Address");
const Category = require("./Category");
const Product = require("./Product");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Payment = require("./Payment");
const ShippingInfo = require("./ShippingInfo");
const ReturnRequest = require("./ReturnRequest");
const Bid = require("./Bid");
const Review = require("./Review");
const Message = require("./Message");
const Coupon = require("./Coupon");
const Inventory = require("./Inventory");
const Feedback = require("./Feedback");
const Dispute = require("./Dispute");
const Store = require("./Store");

module.exports = {
  User,
  Address,
  Category,
  Product,
  Order,
  OrderItem,
  Payment,
  ShippingInfo,
  ReturnRequest,
  Bid,
  Review,
  Message,
  Coupon,
  Inventory,
  Feedback,
  Dispute,
  Store,
};
// // --- Quản Lý Dashboard (Dashboard Management) ---

// /**
//  * @desc Lấy báo cáo tổng quan cho dashboard admin (hỗ trợ lọc theo period: week, month, year, hoặc all time)
//  * @route GET /api/admin/report
//  * @query period=week/month/year (optional, default all time)
//  * @access Riêng tư (Admin)
//  */
// exports.getAdminReport = async (req, res) => {
//   const { period } = req.query;
//   try {
//     let dateFilter = {};
//     const now = new Date();
//     if (period === "week") {
//       const oneWeekAgo = new Date(now);
//       oneWeekAgo.setDate(now.getDate() - 7);
//       dateFilter = { createdAt: { $gte: oneWeekAgo } }; // Sử dụng createdAt cho các model
//     } else if (period === "month") {
//       const oneMonthAgo = new Date(now);
//       oneMonthAgo.setMonth(now.getMonth() - 1);
//       dateFilter = { createdAt: { $gte: oneMonthAgo } };
//     } else if (period === "year") {
//       const oneYearAgo = new Date(now);
//       oneYearAgo.setFullYear(now.getFullYear() - 1);
//       dateFilter = { createdAt: { $gte: oneYearAgo } };
//     }

//     // Tính tổng doanh thu từ orders shipped
//     const totalRevenueStats = await Order.aggregate([
//       { $match: { ...dateFilter, status: "completed" } },
//       { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
//     ]);
//     const totalRevenue =
//       totalRevenueStats.length > 0 ? totalRevenueStats[0].totalRevenue : 0;

//     // Tính số unique customers (buyerId unique từ orders)
//     const uniqueCustomersStats = await Order.aggregate([
//       { $match: dateFilter },
//       { $group: { _id: "$buyerId" } },
//       { $count: "uniqueCustomers" },
//     ]);
//     const uniqueCustomers =
//       uniqueCustomersStats.length > 0
//         ? uniqueCustomersStats[0].uniqueCustomers
//         : 0;

//     // Tính số products shipped (tổng quantity từ orderItems của orders shipped)
//     const productsShippedStats = await Order.aggregate([
//       { $match: { ...dateFilter, status: "completed" } },
//       {
//         $lookup: {
//           from: "orderitems",
//           localField: "_id",
//           foreignField: "orderId",
//           as: "items",
//         },
//       },
//       { $unwind: "$items" },
//       { $group: { _id: null, productsShipped: { $sum: "$items.quantity" } } },
//     ]);
//     const productsShipped =
//       productsShippedStats.length > 0
//         ? productsShippedStats[0].productsShipped
//         : 0;

//     // Doanh thu theo category (từ orderItems của orders shipped, group by product.categoryId)
//     const revenueByCategory = await Order.aggregate([
//       { $match: { ...dateFilter, status: "completed" } },
//       {
//         $lookup: {
//           from: "orderitems",
//           localField: "_id",
//           foreignField: "orderId",
//           as: "items",
//         },
//       },
//       { $unwind: "$items" },
//       {
//         $lookup: {
//           from: "products",
//           localField: "items.productId",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       { $unwind: "$product" },
//       {
//         $group: {
//           _id: "$product.categoryId",
//           totalRevenue: {
//             $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "_id",
//           foreignField: "_id",
//           as: "category",
//         },
//       },
//       { $unwind: "$category" },
//       { $project: { name: "$category.name", value: "$totalRevenue" } },
//     ]);

//     // Top destinations (group by address.city or country từ orders shipped)
//     const topDestinations = await Order.aggregate([
//       { $match: { ...dateFilter, status: "completed" } },
//       {
//         $lookup: {
//           from: "addresses",
//           localField: "addressId",
//           foreignField: "_id",
//           as: "address",
//         },
//       },
//       { $unwind: "$address" },
//       { $group: { _id: "$address.city", count: { $sum: 1 } } },
//       { $sort: { count: -1 } },
//       { $limit: 5 },
//       { $project: { name: "$_id", value: "$count" } },
//     ]);

//     // Doanh thu theo thời gian (group by date, ví dụ theo ngày)
//     const revenueOverTime = await Order.aggregate([
//       { $match: { ...dateFilter, status: "completed" } },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
//           revenue: { $sum: "$totalPrice" },
//         },
//       },
//       { $sort: { _id: 1 } },
//       { $project: { date: "$_id", revenue: 1, _id: 0 } },
//     ]);

//     // Top products (từ orderItems của orders completed, group by productId)
//     const topProducts = await Order.aggregate([
//       { $match: { ...dateFilter, status: "completed" } },
//       {
//         $lookup: {
//           from: "orderitems",
//           localField: "_id",
//           foreignField: "orderId",
//           as: "items",
//         },
//       },
//       { $unwind: "$items" },
//       {
//         $group: {
//           _id: "$items.productId",
//           quantity: { $sum: "$items.quantity" },
//           revenue: {
//             $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           localField: "_id",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       { $unwind: "$product" },
//       { $sort: { revenue: -1 } },
//       { $limit: 5 },
//       { $project: { product: "$product.title", quantity: 1, revenue: 1 } },
//     ]);

//     // Top categories by number of products
//     const topCategoriesByProducts = await Product.aggregate([
//       { $match: dateFilter },
//       { $group: { _id: "$categoryId", count: { $sum: 1 } } },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "_id",
//           foreignField: "_id",
//           as: "category",
//         },
//       },
//       { $unwind: "$category" },
//       { $sort: { count: -1 } },
//       { $limit: 5 },
//       { $project: { name: "$category.name", value: "$count" } },
//     ]);

//     // Recent Activity: Fetch last 10 from various models, merge and sort
//     const recentUsers = await User.find(dateFilter)
//       .select("username createdAt")
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .lean()
//       .exec()
//       .then((docs) =>
//         docs.map((d) => ({
//           type: "New User",
//           details: d.username,
//           createdAt: d.createdAt,
//         }))
//       );
//     const recentStores = await Store.find(dateFilter)
//       .select("storeName createdAt")
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .lean()
//       .exec()
//       .then((docs) =>
//         docs.map((d) => ({
//           type: "New Store",
//           details: d.storeName,
//           createdAt: d.createdAt,
//         }))
//       );
//     const recentProducts = await Product.find(dateFilter)
//       .select("title createdAt")
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .lean()
//       .exec()
//       .then((docs) =>
//         docs.map((d) => ({
//           type: "New Product",
//           details: d.title,
//           createdAt: d.createdAt,
//         }))
//       );
//     const recentOrders = await Order.find(dateFilter)
//       .select("totalPrice createdAt")
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .lean()
//       .exec()
//       .then((docs) =>
//         docs.map((d) => ({
//           type: "New Order",
//           details: `Total: ${d.totalPrice}`,
//           createdAt: d.createdAt,
//         }))
//       );
//     const recentReviews = await Review.find(dateFilter)
//       .select("rating createdAt")
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .lean()
//       .exec()
//       .then((docs) =>
//         docs.map((d) => ({
//           type: "New Review",
//           details: `Rating: ${d.rating}`,
//           createdAt: d.createdAt,
//         }))
//       );

//     const recentActivity = [
//       ...recentUsers,
//       ...recentStores,
//       ...recentProducts,
//       ...recentOrders,
//       ...recentReviews,
//     ]
//       .sort((a, b) => b.createdAt - a.createdAt)
//       .slice(0, 10); // Lấy 10 mới nhất

//     // Top 5 new users
//     const top5NewUsers = await User.find(dateFilter)
//       .select("username fullname email createdAt")
//       .sort({ createdAt: -1 })
//       .limit(5);

//     // Top 5 new sellers (users with role "seller")
//     const top5NewSellers = await User.find({ ...dateFilter, role: "seller" })
//       .select("username fullname email createdAt")
//       .sort({ createdAt: -1 })
//       .limit(5);

//     res.status(200).json({
//       success: true,
//       data: {
//         totalRevenue,
//         uniqueCustomers,
//         productsShipped,
//         revenueByCategory,
//         topDestinations,
//         revenueOverTime,
//         topProducts,
//         topCategoriesByProducts,
//         recentActivity,
//         top5NewUsers,
//         top5NewSellers,
//       },
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy báo cáo dashboard");
//   }
// };
