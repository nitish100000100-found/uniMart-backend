const {User} = require("../models/user.js");
const bcrypt = require("bcryptjs");


async function signup(req, res, next) {
    

  const { username, password, phone, email } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(200).json({ message:"User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      phone,
    });

    await newUser.save();

    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Server error");
  }
}

module.exports = { signup };
