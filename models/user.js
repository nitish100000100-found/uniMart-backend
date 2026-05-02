const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  phone: {
    type: String,
    required: true,
    match: /^\d{10}$/   
  }

}, { timestamps: true });


const User= mongoose.model("User", userSchema)
module.exports ={User}