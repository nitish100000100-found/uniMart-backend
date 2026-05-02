const mongoose = require("mongoose");
const { itemSchema } = require("./item.js");


const buyerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    wishlist: [itemSchema],

    previousPurchases: [itemSchema],
    requestSend: [itemSchema],
  },
  { timestamps: true },
);

const Buyer = mongoose.model("Buyer", buyerSchema);

module.exports = { Buyer };
