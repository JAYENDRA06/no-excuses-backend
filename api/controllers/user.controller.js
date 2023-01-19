const jwt = require("jsonwebtoken");
const { User } = require("../models");
const Meal = require("../models/Meal.model");

require("dotenv").config();

// creating new user
const createUser = async (req, res) => {
  const { name, email, password, score } = req.body;
  const isNewUser = await User.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: "This email is already in use, try sign-in",
    });
  const user = await User({
    name,
    email,
    password,
    score,
  });
  await user.save();
  res.json({ success: true, user });
};

// sign-in new user
const userSignIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.json({
      success: false,
      message: "user not found, with the given email!",
    });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.json({
      success: false,
      message: "email / password does not match!",
    });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  let oldTokens = user.tokens || [];

  if (oldTokens.length) {
    oldTokens = oldTokens.filter((t) => {
      const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
      if (timeDiff < 86400) {
        return t;
      }
    });
  }

  await User.findByIdAndUpdate(user._id, {
    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
  });

  const userInfo = {
    fullname: user.name,
    email: user.email,
    score: user.score,
  };

  res.json({ success: true, user: userInfo, token });
};

// user sign-out
const signOut = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization fail!" });
    }

    const tokens = req.user.tokens;

    const newTokens = tokens.filter((t) => t.token !== token);

    await User.findByIdAndUpdate(req.user._id, { tokens: newTokens });
    res.json({ success: true, message: "Sign out successfully!" });
  }
};

// get meals
const getMeals = async (req, res) => {
  const query = req.query;

  try {
    const meal = await Meal.findOne({ range: query.range });
    return res.status(201).json({ success: true, meal: meal });
  } catch (e) {
    res.status(400).json({ success: false, message: "No meals found" });
  }
};

// send score
const sendScore = async (req, res) => {
  const { email, score } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { score: score } },
      { new: true }
    );
    return res.status(201).json({ success: true, user: user });
  } catch (e) {
    res.status(400).json({ success: false, message: "User Not Found!" });
  }
};

module.exports = {
  createUser,
  userSignIn,
  signOut,
  getMeals,
  sendScore,
};
