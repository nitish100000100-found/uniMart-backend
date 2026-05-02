const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    ageInYears: {
      type: Number,
      default: 0,
      min: 0,
    },

    owner: {
      type: String,
      required: true,
    },

    soldTo: {
      type: String,
      default: null,
    },

    imageUrl: {
      type: String,
      default: "",
    },
    public_id:{
      type: String,
      default: "",

    },
    section: {
      type: String,
      default:"NO CATEGORY",
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  },
);

const Item = mongoose.model("Item", itemSchema);

module.exports = { Item, itemSchema };
