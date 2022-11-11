const express = require('express');
const tourController = require('../controllers/tourControllers');
const authController = require('../controllers/authControllers');
const reviewRouter = require('./reviewRoutes');

// implementing router

const tourRouter = express.Router();
// tourRouter.param('id', tourController.checkId);

// nested routing
tourRouter.use("/:tourId/reviews", reviewRouter)

tourRouter
    .route("/")
    .get(tourController.getAllTours)
    .post(authController.protected, authController.restrictTo("admin", "lead-guide"), tourController.postTour);

tourRouter
    .route("/top-5-cheap")
    .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter
    .route("/tour-stats")
    .get(tourController.getTourStats);

tourRouter
    .route("/monthly-plan/:year")
    .get(authController.protected, authController.restrictTo("admin", "lead-guide", "guide"), tourController.getMonthlyPlan);

tourRouter
    .route("/tours-within/:distance/center/:latlng/unit/:unit")
    .get(tourController.getToursWithin)
tourRouter
    .route("/distances/:latlng/unit/:unit")
    .get(tourController.getTourDistances)

tourRouter
    .route("/:id")
    .get(tourController.getTourBYid)
    .patch(authController.protected, authController.restrictTo("admin", "lead-guide"), tourController.patchTour)
    .delete(authController.protected, authController.restrictTo("admin", "lead-guide"), tourController.deleteTour);

// nested routes
// POST /tours/:id/reviews
// GET /tours/:id/reviews
// GET /tours/:id/reviews/:userid

// tourRouter
//     .route("/:tourId/reviews")
//     .post(authController.protected, authController.restrictTo("user"), reviewController.postReview)

module.exports = tourRouter;