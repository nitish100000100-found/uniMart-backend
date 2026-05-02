const mongoose = require("mongoose");
const { Item } = require("../models/item.js");
const { Seller } = require("../models/seller.js");
const { User } = require("../models/user.js");
const fs = require("fs");
const path = require("path");
const { uploadToCloudinary } = require("../js/extraFxn.js");
const { cloudinary } = require("../js/extraFxn.js");
const { Buyer }=require("../models/buyer.js")
const { PurchaseRequest }=require("../models/purchaseRequest.js")

async function upload(req, res, next) {
  const username = req.params.username;

  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Invalid file type or no file uploaded" });
  }
  let uploadedPublicId = null;
  const originalName = path.parse(req.file.originalname).name;

  const cleanName = originalName.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");

  const uniqueName = `${username}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}_${cleanName}`;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await uploadToCloudinary(req.file.buffer, uniqueName);
    uploadedPublicId = result.public_id;

    const { itemName, description, price, productAgeYears, section } = req.body;

    const newItem = new Item({
      itemName,
      description,
      price,
      ageInYears: productAgeYears,
      imageUrl: result.secure_url,
      owner: username,
      section,
      public_id: result.public_id,
    });

    await newItem.save({ session });

    const seller = await Seller.findOne({ username }).session(session);

    if (!seller) {
      const user = await User.findOne({ username }).session(session);

      if (!user) {
        console.log("!user");
        throw new Error("User not found");
      }

      const newSeller = new Seller({
        username,
        listed: [newItem],
        phone: user.phone,
      });

      await newSeller.save({ session });
    } else {
      seller.listed.push(newItem);
      await seller.save({ session });
    }

    await session.commitTransaction();

    return res.status(200).json({ item: newItem });
  } catch (err) {
    await session.abortTransaction();

    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (e) {
        console.error("Cloudinary cleanup failed:", e.message);
      }
    }

    return res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
}

async function firstDb(req, res) {
  try {
    const { username } = req.body;

    const seller = await Seller.findOne({ username });

    if (!seller) {
      return res.status(200).json({
        data: {
          username,
          listed: [],
          sold: [],
          ratings: [],
          starRated: false,
          purchaseRequests: [],
        },
      });
    }

    return res.status(200).json({
      data: seller,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
    });
  }
}
// this databse query is written by claud
// it removes an item fomr buyer wishlist and send request as well as from seller listed
async function deleteItem(req, res) {
  const { item } = req.body;

  if (!item || !item._id) {
    return res.status(400).json({ message: "Invalid item data" });
  }

  const delURL = item.public_id;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await Seller.updateOne(
      { username: item.owner },
      { $pull: { listed: { _id: item._id } } },
      { session },
    );

    await Seller.updateOne(
      { username: item.owner },
      { $pull: { purchaseRequests: { itemId: item._id } } },
      { session },
    );

    await Item.findByIdAndDelete(item._id).session(session);

    await Buyer.updateMany(
      {},
      { $pull: { wishlist: { _id: item._id } } },
      { session },
    );

    await Buyer.updateMany(
      {},
      { $pull: { requestSend: { _id: item._id } } },
      { session },
    );

    await PurchaseRequest.deleteMany(
      { itemId: item._id },
      { session },
    );

    const resu = await cloudinary.uploader.destroy(delURL, {
      invalidate: true,
    });

    if (resu.result !== "ok" && resu.result !== "not found") {
      throw new Error("Cloudinary delete failed");
    }

    const updatedSeller = await Seller.findOne({
      username: item.owner,
    }).session(session);

    await session.commitTransaction();

    res.status(200).json({
      message: "Item deleted successfully",
      seller: updatedSeller,
    });
  } catch (err) {
    await session.abortTransaction();
    console.log(err);
    res.status(500).json({ message: "Delete failed" });
  } finally {
    session.endSession();
  }
}

module.exports = { upload, firstDb, deleteItem };
