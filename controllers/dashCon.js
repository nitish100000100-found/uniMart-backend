const mongoose = require("mongoose");
const { Item } = require("../models/item.js");
const { Seller } = require("../models/seller.js");
const { User } = require("../models/user.js");
const { Buyer } = require("../models/buyer.js");                   
const { PurchaseRequest } = require("../models/purchaseRequest.js");

async function removeFromCart(req, res, next) {
  const { item, username } = req.body;

  try {
    const existingBuyer = await Buyer.findOne({ username });

    if (!existingBuyer) {
      return res.status(404).json({
        message: "Buyer not found",
      });
    }

    const exists = existingBuyer.wishlist.some(
      (it) => it._id.toString() === item._id.toString(),
    );

    if (!exists) {
      return res.status(200).json({
        message: "Item not in cart",
      });
    }

    existingBuyer.wishlist = existingBuyer.wishlist.filter(
      (it) => it._id.toString() !== item._id.toString(),
    );

    await existingBuyer.save();

    return res.status(200).json({
      message: `${item.itemName} removed from cart`,
    });
  } catch (err) {
    return res.status(500).json({
      message: `Couldn't remove ${item.itemName} from cart`,
    });
  }
}



async function cancelBuyRequest(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { item, username } = req.body;

  try {
    const existingBuyer = await Buyer.findOne({ username }).session(session);

    if (!existingBuyer) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Buyer not found" });
    }

    const exists = existingBuyer.requestSend.some(
      (it) => it._id.toString() === item._id.toString(),
    );

    if (!exists) {
      await session.abortTransaction();
      return res.status(200).json({ message: "Request not found" });
    }

    existingBuyer.requestSend = existingBuyer.requestSend.filter(
      (it) => it._id.toString() !== item._id.toString(),
    );
    existingBuyer.wishlist.push({ ...item, _id: item._id });
    await existingBuyer.save({ session });

    const deletedReq = await PurchaseRequest.findOneAndDelete({
      itemId: item._id,
      requestedBy: username,       
    }).session(session);

    if (!deletedReq) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Purchase request not found" });
    }

    const seller = await Seller.findOne({ username: item.owner }).session(session);

    if (!seller) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.purchaseRequests = seller.purchaseRequests.filter(
      (pr) => pr._id.toString() !== deletedReq._id.toString(),
    );

    await seller.save({ session });
    await session.commitTransaction();

    return res.status(200).json({
      message: `${item.itemName}'s buy request cancelled`,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    return res.status(500).json({
      message: `Couldn't cancel ${req.body.item?.itemName}'s request`,
    });
  } finally {
    session.endSession();
  }
}


async function sellerDash(req, res, next) {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingSeller = await Seller.findOne({ username });

    if (existingSeller) {
      return res.json({
        user,
        seller: existingSeller, 
      });
    }

    const newSeller = new Seller({
      username: user.username,
      phone: user.phone,
    });

    await newSeller.save();

    return res.json({
      user,
      seller: newSeller, 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
}


async function sellFxn(req, res, next) {
  try {
    const { itemID, buyerUsername } = req.body;

    const item = await Item.findById(itemID);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const ownerUsername = item.owner;

    item.soldTo = buyerUsername;
    await item.save();

    const allRequests = await PurchaseRequest.find({ 
      itemId: new mongoose.Types.ObjectId(itemID) 
    });
    const allBuyerUsernames = allRequests.map((r) => r.requestedBy);

    await Buyer.updateMany(
      { username: { $in: allBuyerUsernames } },
      {
        $pull: {
          requestSend: { _id: item._id },
          wishlist: { _id: item._id },
        },
      }
    );

    // ✅ Add item to the winning buyer's previousPurchases
    await Buyer.findOneAndUpdate(
      { username: buyerUsername },
      {
        $push: { previousPurchases: item },
      }
    );

    await PurchaseRequest.deleteMany({ 
      itemId: new mongoose.Types.ObjectId(itemID) 
    });

    await Seller.findOneAndUpdate(
      { username: ownerUsername },
      {
        $pull: {
          listed: { _id: item._id },
          purchaseRequests: { itemId: new mongoose.Types.ObjectId(itemID) },
        },
        $push: { sold: item },
      }
    );

    const newSeller = await Seller.findOne({ username: ownerUsername });
    const user = await User.findOne({ username: ownerUsername });

    res.status(200).json({ user, seller: newSeller });

  } catch (err) {
    next(err);
  }
}

async function rejectSellFxn(req, res, next) {
  try {
    const { itemID, buyerUsername } = req.body;

    const item = await Item.findById(itemID);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const ownerUsername = item.owner;

    await PurchaseRequest.findOneAndDelete({
      itemId: new mongoose.Types.ObjectId(itemID),
      requestedBy: buyerUsername,
    });

    await Buyer.findOneAndUpdate(
      { username: buyerUsername },
      { 
        $pull: { requestSend: { _id: item._id } },
        $push: { wishlist: item }
      }
    );

    await Seller.findOneAndUpdate(
      { username: ownerUsername },
      {
        $pull: {
          purchaseRequests: { 
            itemId: new mongoose.Types.ObjectId(itemID), 
            requestedBy: buyerUsername 
          },
        },
      }
    );

    const newSeller = await Seller.findOne({ username: ownerUsername });
    const user = await User.findOne({ username: ownerUsername });

    res.status(200).json({ user, seller: newSeller });

  } catch (err) {
    next(err);
  }
}

module.exports={ removeFromCart,cancelBuyRequest ,sellerDash, sellFxn , rejectSellFxn }
















