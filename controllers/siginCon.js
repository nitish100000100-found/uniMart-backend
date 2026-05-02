const {User} = require("../models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function signin(req, res, next) {
  
  const { username, password } = req.body;
  

  try {
    
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(200).json({"message":"User not found"});
    }


    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(200).json({"message":"Wrong Password"});
    }


    const token = jwt.sign(
      { id: user._id, loggedIn: true, username },
     process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ "message": "OK" });
  } catch (err) {
    console.log(err);
    return res.status(200).json({"message":"Databse Error"});
  }
}

function isSignin(req, res,next) {
  console.log("here at is sign in")
  
  const token = req.cookies.token;
  if (!token) {
    console.log("token doesn't exist")
    
    return res.status(200).json({
      success: false,
      reason: "NO_TOKEN"
    });
  }

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
   
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      reason: "INVALID_TOKEN"
    });
  }
}
async function logOut(req, res,next){
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, 
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Logout failed",
    });
  }
};

module.exports = { signin, isSignin,logOut };
