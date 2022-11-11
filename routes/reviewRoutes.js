const express = require('express');
const reviewController = require('../controllers/reviewControllers');
const authController = require('../controllers/authControllers');


const reviewRouter = express.Router({ mergeParams: true });

//POST /tours/:id/reviews
// POST reviews

reviewRouter.use(authController.protected)

reviewRouter
    .route("/")
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo("user"), reviewController.setUserAndTourID, reviewController.postReview)

reviewRouter
    .route("/:id")
    .get(reviewController.getReview)
    .patch(authController.restrictTo("user", "admin"), reviewController.updateReview)
    .delete(authController.restrictTo("user", "admin"), reviewController.deleteReview)
module.exports = reviewRouter