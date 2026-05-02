const express = require("express");
const dashRouter = express.Router();
const dashCon=require("../controllers/dashCon.js")


dashRouter.post("/removefromcart",dashCon.removeFromCart)
dashRouter.post("/cancelbuyrequest",dashCon.cancelBuyRequest)
dashRouter.post("/sellerdash",dashCon.sellerDash)
dashRouter.post("/rejectsellfxn",dashCon.rejectSellFxn)
dashRouter.post("/sellfxn",dashCon.sellFxn)



module.exports = dashRouter