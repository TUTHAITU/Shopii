const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAuction: { type: Boolean, default: false },
    auctionEndTime: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);