require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const signinRouter = require("./routes/signin.js");
const singupRouter = require("./routes/signup.js");
const sellRouter = require("./routes/sell.js");
const homeRouter = require("./routes/home.js");
const dashRouter = require("./routes/dash.js");

const dbUrl = process.env.DB_PATH;

const app = express();

app.use(
  cors({
    origin: [
      "https://uni-mart-frontend.vercel.app",
      "https://uni-mart-frontend-git-main-nitish100000100-founds-projects.vercel.app",
      "https://uni-mart-frontend-pybdqnhja-nitish100000100-founds-projects.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use((req, res, next) => {
  next();
});
app.use("/signin", signinRouter);
app.use("/signup", singupRouter);
app.use("/sell", sellRouter);
app.use("/home", homeRouter);
app.use("/dash", dashRouter);

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("DB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
