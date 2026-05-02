const mongoose = require("mongoose");

const { itemSchema } = require("./item");

const { purchaseRequestSchema } = require("./purchaseRequest");

const sellerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  listed: [itemSchema],

  sold: [itemSchema],

  purchaseRequests: [purchaseRequestSchema],
  phone: {
    type: String,
    required: true,
  },
});

const Seller = mongoose.model("Seller", sellerSchema);

module.exports = { Seller };
