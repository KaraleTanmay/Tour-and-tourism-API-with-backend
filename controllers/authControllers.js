const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('../utils/appErrors');
const sendEmail = require('../utils/mail');
const { promisify } = require('util');
const crypto = require('crypto');

const signToken = (id) => {
    return (jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    }))
}

const createSendJWTToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 100
        ),
        httpOnly: true
    }

    if (process.env.NODE_ENV === "production") {
        cookieOptions.secure = true
    }

    user.password = undefined

    res.cookie("jwt", token, cookieOptions)

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    // const newUser = await User.create({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password,
    //     passwordConfirm: req.body.passwordConfirm
    // });
    const newUser = await User.create(req.body);

    createSendJWTToken(newUser, 201, res)

})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // check if password and email exist in sent data
    if (!email || !password) {
        return next((new appError("plaease send email and password", 400)));
    }
    // check if email exist and password is correct
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.checkPassword(password, user.password))) {
        return next((new appError("plaease send correct email and password", 401)));
    }

    createSendJWTToken(user, 200, res)
})

exports.protected = catchAsync(async (req, res, next) => {
    //to check if token exist in request
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new appError("please log in first", 401));
    }

    // token varification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new appError("the user no longer exists", 401));
    }

    // check if user has changed password
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new appError('User recently changed password! Please log in again.', 401)
        );
    }
    req.user = freshUser;
    next()
})

exports.restrictTo = (...roles) => {
    return ((req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new appError("you don't have permission to perform this action", 403))
        }
        next()
    })
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new appError('There is no user with email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(err)
        return next(
            new appError('There was an error sending the email. Try again later!'),
            500
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {

    // get the user based on the token
    const hashToken = crypto.createHash('sha256').update(req.params.token).digest("hex");
    const user = await User.findOne({ passwordResetToken: hashToken, passwordResetExpires: { $gt: Date.now() } });

    // if the token has not expired and there is user update the password 
    if (!user) {
        return next(new appError("token expired or is invalid", 400))
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // update the changed passwordchangedat property

    //log the user in and send the jwt token
    createSendJWTToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {

    // get the user from collection
    const user = await User.findById(req.user.id).select("+password");

    //check if the posted password is correct
    if (!(await user.checkPassword(req.body.currentPassword, user.password))) {
        return next(new appError("incorrect password", 401));
    }

    //update the password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    user.passwordChangedAt = Date.now() - 1000;
    await user.save();

    // log the user in and sending jwt
    createSendJWTToken(user, 200, res)
})