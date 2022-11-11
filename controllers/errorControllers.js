const appError = require("../utils/appErrors");

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path} : ${err.value}`;
    return (new appError(message, 400));
}

const handleDuplicateValueErrorDB = (err) => {
    const errors = Object.keys(err.keyValue).map((ele) => {
        return `${ele} : ${err.keyValue[ele]}`
    })
    const message = `duplicate ${errors.join(",")}. please use another one`;
    return (new appError(message, 400));
}

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((ele) => {
        return ele.message;
    })

    const message = `Invalid values inserted. ${errors.join(",")}`;
    return (new appError(message, 400));
}

const handleInvalidTokenError = (err) => {
    return new appError("invalid token", 401);
}

const handleExpiredTokenError = (err) => {
    return new appError("Token Expired. Please log in again", 401);
}

const sendDevErrors = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendProdErrors = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    }
    else {
        console.log("error", err);
        res.status(500).json({
            status: "error",
            message: "something went wrong"
        })
    }
}
module.exports = (err, req, res, next) => {
    err.status = err.status || "error";
    err.statusCode = err.statusCode || 404;

    if (process.env.NODE_ENV === "developement") {
        sendDevErrors(err, res);
    }
    else if (process.env.NODE_ENV === "production") {
        let error = { ...err };
        if (err.name === "CastError") {
            error = handleCastErrorDB(err);
        }
        if (err.code == 11000) {
            error = handleDuplicateValueErrorDB(err);
        }
        if (err.name === "ValidationError") {
            error = handleValidationErrorDB(err);
        }
        if (err.name === "JsonWebTokenError") {
            error = handleInvalidTokenError(err);
        }
        if (err.name === "TokenExpiredError") {
            error = handleExpiredTokenError(err);
        }

        sendProdErrors(error, res);
    }
}