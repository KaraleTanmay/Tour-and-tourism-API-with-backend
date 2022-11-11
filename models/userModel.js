const mongoose = require('mongoose');
const validator = require('validator');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: [true, "user must have unique username"],
        trim: true,
        minlength: [5, "username must be longer than 5 Charactes"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "email is necessary"],
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, "entered email is not valid"]
    },
    photo: {
        type: String,
    },
    password: {
        type: String,
        required: [true, "user must have password"],
        minlength: [8, "password should have atleast 8 characters"],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "re-enter the password"],
        validate: {
            validator: function (ele) {
                return ele === this.password;
            },
            message: "password not matched"
        }
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: ["admin", "user", "guide", "lead-guide"],
        default: "user"
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
})

userSchema.pre("save", function (next) {
    if (!this.isDirectModified("password") || this.isNew) {
        return next();
    }
    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next()
})

userSchema.methods.checkPassword = async function (candidatePassword, userpassword) {
    return (await bcrypt.compare(candidatePassword, userpassword));
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;