const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const errorController = require('./controllers/errorControllers');
const appError = require('./utils/appErrors');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// creating app using express instance
const app = express();

// setting headers using helmet
app.use(helmet())

// adding middleware to acces body of post requests
app.use(express.json({ limit: "10kb" }))

// sanitizing data coming in body and url NoSQL query injections
// app.use(mongoSanitizer())

// sanitizing xss data
// app.use(xss())

// logger middleware
if (process.env.node_env === 'developement') {
    app.use(morgan("dev"));
}
// app.use((req, res, next) => {
//     req.time = new Date().toISOString();
//     next();
// })

// rate limiter middleware
const limiter = rateLimiter({
    max: 100,
    windowMS: 60 * 60 * 1000,
    message: "to many requests from this IP. please try again after an hour"
})
app.use("/api", limiter)

// pollution preventing middleware
app.use(hpp({
    whitelist: ["duration"]
}))

// serving staticfile
app.use(express.static(`${__dirname}/public`));

// router middleware
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter)

// invalid routes handler
app.all("*", (req, res, next) => {
    next(new appError(`requested route ${req.originalUrl} is not available on this server`, 404));
})

// errorcontroller middleware
app.use(errorController);

// listening to the server
module.exports = app;