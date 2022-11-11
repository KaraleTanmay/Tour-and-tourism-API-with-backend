const express = require('express');
const userController = require('../controllers/userControllers')
const authController = require('../controllers/authControllers');

// implementing router
const userRouter = express.Router();

userRouter.post("/signup", authController.signup);
userRouter.post("/login", authController.login);
userRouter.post("/forgot-password", authController.forgotPassword);
userRouter.patch("/reset-password/:token", authController.resetPassword);

userRouter.use(authController.protected);

userRouter.get("/me", authController.protected, userController.getMe, userController.getUser)
userRouter.patch("/updateMe", authController.protected, userController.updateMe);
userRouter.delete("/deleteMe", authController.protected, userController.deleteMe);
userRouter.patch("/change-password", authController.protected, authController.updatePassword);

userRouter.use(authController.restrictTo("admin"));

userRouter
    .route("/")
    .get(userController.getAllUsers);

userRouter
    .route("/:id")
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = userRouter;