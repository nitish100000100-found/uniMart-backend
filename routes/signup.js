const express = require("express");
const signupRouter = express.Router();
const signupCon = require("../controllers/signupCon.js");






signupRouter.post("/",signupCon.signup)






module.exports = signupRouter;