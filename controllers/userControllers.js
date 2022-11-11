const User = require("../models/userModel");
const appError = require("../utils/appErrors");
const catchAsync = require("../utils/catchAsync");
const factory = require('./handlerFactory');

const filterObj = (obj, ...fields) => {
    const newObj = {};
    Object.keys(obj).forEach(element => {
        if (fields.includes(element)) {
            newObj[element] = obj[element];
        }
    })
    return newObj;
}

// exports.checkId = (req, res, next, val) => {
//     if (req.params.id * 1 > 10) {
//         return res.status(400).json({
//             status: "fail",
//             message: "invalid id"
//         })
//     }
//     next();
// }

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

exports.updateMe = catchAsync(async (req, res, next) => {
    // check if user is trying to change password
    if (req.body.password || req.body.passwordConfirm) {
        return (next(new appError("you cannot change password here. please do it from change-password route", 400)))
    }

    // if not update the user with given data
    const filteredBody = filterObj(req.body, "name", "email")
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })

    res.status(200).json({
        "status": "success",
        "data": {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(200).json({
        "status": "success",
        "data": null
    })
})

exports.deleteUser = factory.deleteOne(User);

// do not change password
exports.updateUser = factory.updateOne(User);

exports.getUser = factory.getOne(User)


exports.getAllUsers = factory.getAll(User)