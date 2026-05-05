const { User } = require("../models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function signin(req, res, next) {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(200).json({ success: false, message: "This username doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(200).json({ success: false, message: "Wrong Password" });
    }

    const token = jwt.sign(
      { id: user._id, loggedIn: true, username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, username });
  } catch (err) {
    console.log(err);
    return res.status(200).json({ success: false, message: "Database Error" });
  }
}

function isSignin(req, res) {
  const token = req.cookies?.token;

  if (!token) {
    return res.json({ success: false, reason: "NO_TOKEN" });
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, reason: "INVALID_TOKEN" });
  }
}

function logOut(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.json({ success: true, message: "Logged out" });
}

module.exports = { signin, isSignin, logOut };
