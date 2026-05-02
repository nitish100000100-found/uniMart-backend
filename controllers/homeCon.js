const { Seller } = require("../models/seller.js");
const { Item } = require("../models/item.js");
const { Buyer } = require("../models/buyer.js");
const { User } = require("../models/user.js");
const { PurchaseRequest } = require("../models/purchaseRequest.js");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function first(req, res, next) {
  try {
    const sellers = await Seller.find({
      username: { $in: ["NITISH", "ABHI"] },
    });

    res.status(200).json({
      message: "Sellers fetched successfully",
      data: sellers,
    });
  } catch (err) {
    res.status(500).json({ message: "Error occurred" });
  }
}

async function find(req, res, next) {
  try {
    const toSearch = req.body.search.trim();
    const items = await Item.find({
      soldTo: { $in: [null, ""] }, 
      $or: [
        { itemName: { $regex: toSearch, $options: "i" } },
        { owner: { $regex: toSearch, $options: "i" } },
        { section: { $regex: toSearch, $options: "i" } },
      ],
    });
    res.status(200).json({ message: "Search results fetched", data: items });
  } catch (err) {
    res.status(500).json({ message: "Error occurred", error: err.message });
  }
}

async function findCat(req, res, next) {
  try {
    const toSearch = req.body.category.trim().toUpperCase();
    const items = await Item.find({ 
      section: toSearch,
      soldTo: { $in: [null, ""] }, 
    });
    res.status(200).json({ message: "Search results fetched", data: items });
  } catch (err) {
    res.status(500).json({ message: "Error occurred", error: err.message });
  }
}
async function item(req, res, next) {
  try {
    const { id } = req.body;

    const foundItem = await Item.findById(id);

    if (!foundItem) {
      return res.status(200).json({ message: "Item not found" });
    }
    const user=await User.findOne({ username: foundItem.owner })
    const seller = await Seller.findOne({ username: foundItem.owner });
    const moreData = seller.listed.filter(
      (it) => it._id.toString() !== foundItem._id.toString(),
    );

    res.status(200).json({
      message: "Item found",
      data: foundItem,
      moreData,
      user
    });
  } catch (err) {
    res.status(400).json({ message: "Database error" });
  }
}

async function addToCart(req, res, next) {
  const { item, username } = req.body;

  try {
    const existingBuyer = await Buyer.findOne({ username });

    if (!existingBuyer) {
      const user = await User.findOne({ username });

      const newBuyer = new Buyer({
        username: user.username,
        phone: user.phone,
        wishlist: [{ ...item, _id: item._id }],
      });

      await newBuyer.save();

      return res.status(200).json({
        message: `${item.itemName} Added To Cart`,
      });
    }

    const alreadyRequested = existingBuyer.requestSend.some(
      (it) => it._id.toString() === item._id.toString(),
    );

    if (alreadyRequested) {
      return res.status(200).json({
        message: "Buy Request Already Sent",
      });
    }

    const exists = existingBuyer.wishlist.some(
      (it) => it._id.toString() === item._id.toString(),
    );

    if (exists) {
      return res.status(200).json({
        message: "Already in Add To Cart",
      });
    }

    existingBuyer.wishlist.push({ ...item, _id: item._id });
    await existingBuyer.save();

    return res.status(200).json({
      message: `${item.itemName} Added To Cart`,
    });
  } catch (err) {
    return res.status(500).json({
      message: `Couldn't Add ${item.itemName} To Cart`,
    });
  }
}

async function buyRequest(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { item, username } = req.body;

  try {
    const existingBuyer = await Buyer.findOne({ username }).session(session);

    if (!existingBuyer) {
      const user = await User.findOne({ username }).session(session);

      const newBuyer = new Buyer({
        username: user.username,
        phone: user.phone,
        requestSend: [{ ...item, _id: item._id }],
      });

      await newBuyer.save({ session });

      const purchaseReq = new PurchaseRequest({
        itemId: item._id,
        itemName: item.itemName,
        requestedBy: username,
        item
      });

      await purchaseReq.save({ session });

      const seller = await Seller.findOne({ username: item.owner }).session(session);

      seller.purchaseRequests.push(purchaseReq);
      await seller.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        message: `${item.itemName}'s BUY request sent`,
      });
    }

    const alreadySent = existingBuyer.requestSend.some(
      (it) => it._id.toString() === item._id.toString(),
    );

    if (alreadySent) {
      await session.abortTransaction();

      return res.status(200).json({
        message: "Request already sent",
      });
    }

    const isInWishlist = existingBuyer.wishlist.some(
      (it) => it._id.toString() === item._id.toString(),
    );

    if (isInWishlist) {
      existingBuyer.wishlist = existingBuyer.wishlist.filter(
        (it) => it._id.toString() !== item._id.toString(),
      );
    }

    existingBuyer.requestSend.push({ ...item, _id: item._id });
    await existingBuyer.save({ session });

    const purchaseReq = new PurchaseRequest({
      itemId: item._id,
      itemName: item.itemName,
      requestedBy: username,
      item
    });

    await purchaseReq.save({ session });

    const seller = await Seller.findOne({ username: item.owner }).session(session);

    seller.purchaseRequests.push(purchaseReq);
    await seller.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      message: `${item.itemName}'s BUY request sent`,
    });
  } catch (err) {
    await session.abortTransaction();

    console.error(err);

    return res.status(500).json({
      message: `Couldn't send ${req.body.item?.itemName}'s request`,
    });
  } finally {
    session.endSession();
  }
}

async function buyerDash(req, res) {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const buyer = await Buyer.findOneAndUpdate(
      { username: user.username },
      {
        $setOnInsert: {
          username: user.username,
          phone: user.phone,
          wishlist: [],
          previousPurchases: [],
          rating: [],
          requestSend: [],
        },
      },
      {
        upsert: true,
        returnDocument: 'after', 
        runValidators: true,
      }
    );

    return res.status(200).json({ user, buyer });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

const changePassword = async (req, res) => {
  try {
    let { username, oldPass, newPass } = req.body;

    oldPass = oldPass?.trim();
    newPass = newPass?.trim();

    if (!username || !oldPass || !newPass) {
      return res.json({ success: false, message: "All fields required" });
    }

    if (oldPass === newPass) {
      return res.json({ success: false, message: "New password must differ" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(newPass, 10);
    user.password = hashed;

    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: "Server error" });
  }
};



const changeEmail = async (req, res) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  try {
    let { username, newEmail } = req.body;

    newEmail = newEmail?.trim();

    if (!username || !newEmail) {
      return res.json({ success: false, message: "All fields required" });
    }

    if (!emailRegex.test(newEmail)) {
      return res.json({ success: false, message: "Invalid email" });
    }



    await User.updateOne({ username }, { email: newEmail });

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false });
  }
};

const changePhone = async (req, res) => {
  try {
    let { username, newPhone } = req.body;

    newPhone = newPhone?.trim();

    if (!username || !newPhone) {
      return res.json({ success: false, message: "All fields required" });
    }

    if (!/^\d{10}$/.test(newPhone)) {
      return res.json({ success: false, message: "Invalid phone" });
    }

    await User.updateOne({ username }, { phone: newPhone });

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false });
  }
};

module.exports = {
  first,
  find,
  findCat,
  item,
  addToCart,
  buyRequest,
  buyerDash,
  changePassword,
  changeEmail,
  changePhone,
};
