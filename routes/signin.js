const express = require("express");
const signinRouter = express.Router();
const signinCon = require("../controllers/siginCon.js");

signinRouter.post("/",signinCon.signin)
signinRouter.post("/isSignin", signinCon.isSignin)
signinRouter.post("/logout",signinCon.logOut)



module.exports = signinRouter;
