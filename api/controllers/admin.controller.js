const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Admin } = require("../models");
const Meal = require("../models/Meal.model");

// creating new admin
const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const isNewUser = await Admin.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: "This email is already in use, try sign-in",
    });
  const user = await Admin({
    name,
    email,
    password,
  });
  await user.save();
  res.json({ success: true, user });
};

// sign-in new admin
const userSignIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await Admin.findOne({ email });

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

  await Admin.findByIdAndUpdate(user._id, {
    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
  });

  const userInfo = {
    fullname: user.name,
    email: user.email,
  };

  res.json({ success: true, user: userInfo, token });
};

// sign-out route for admin
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

    await Admin.findByIdAndUpdate(req.user._id, { tokens: newTokens });
    res.json({ success: true, message: "Sign out successfully!" });
  }
};

const pushMeal = async (req, res) => {
  try {
    const meal = new Meal({
      _id: new mongoose.Types.ObjectId(),
      range: req.body.range,
      dietPlan: req.body.dietPlan,
      exercisePlan: req.body.exercisePlan,
    });
    meal.save();
    res.json({ success: true, message: "Meal added successfully!" });
  } catch (e) {
    res.json({ success: false, message: "Meal adding failed!" });
  }
};

module.exports = {
  createUser,
  userSignIn,
  signOut,
  pushMeal,
};
