const mongoose = require("mongoose");
const { itemSchema } = require("./item.js")

const purchaseRequestSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  itemName: String,

  item: {
    type: itemSchema,
    required: true,
  },

  requestedBy: {
    type: String,
    required: true,
  },


  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PurchaseRequest = mongoose.model(
  "PurchaseRequest",
  purchaseRequestSchema,
);

module.exports = { PurchaseRequest, purchaseRequestSchema };
