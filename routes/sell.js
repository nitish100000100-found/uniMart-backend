const express = require("express");
const sellRouter = express.Router();
const sellCon = require("../controllers/sellCon.js");
const {upload} = require("../js/extraFxn.js");
const path = require("path");



sellRouter.post("/upload/:username",upload.single("photo"), sellCon.upload);
sellRouter.post("/firstDB",sellCon.firstDb)
sellRouter.post("/delete",sellCon.deleteItem)


module.exports = sellRouter;