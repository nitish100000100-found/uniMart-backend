const express = require("express");
const homeRouter = express.Router();
const homeCon = require("../controllers/homeCon.js")



homeRouter.post("/first",homeCon.first)
homeRouter.post("/find",homeCon.find)
homeRouter.post("/findCat",homeCon.findCat)
homeRouter.post("/item",homeCon.item)
homeRouter.post("/addtocart",homeCon.addToCart)
homeRouter.post("/buyrequest",homeCon.buyRequest)
homeRouter.post("/buyerdash",homeCon.buyerDash)
homeRouter.post("/changepassword", homeCon.changePassword);

homeRouter.post("/changeemail", homeCon.changeEmail);
homeRouter.post("/changephone", homeCon.changePhone);









module.exports = homeRouter;