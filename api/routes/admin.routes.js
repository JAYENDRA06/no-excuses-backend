const { adminController } = require("../controllers");

const router = require("express").Router();
const { isAuth } = require("../middlewares/auth");
const {
  validateUserSignUp,
  userValidation,
  validateUserSignIn,
} = require("../middlewares/validation/user");

router.post("/create-admin", validateUserSignUp, userValidation, (req, res) => {
  adminController.createUser(req, res);
});
router.post(
  "/sign-in-admin",
  validateUserSignIn,
  userValidation,
  (req, res) => {
    adminController.userSignIn(req, res);
  }
);
router.post("/sign-out", isAuth, (req, res) => {
  adminController.signOut(req, res);
});
router.post("/pushMeal", (req, res) => {
  adminController.pushMeal(req, res);
});

module.exports = router;
