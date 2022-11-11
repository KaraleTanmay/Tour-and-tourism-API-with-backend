const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, "review is must"],
        maxlength: [200, "review should not be more than 200 characters"]
    },
    rating: {
        type: Number,
        required: [true, "rating is must"],
        default: 4,
        min: [1, "review should be greater than or equal to 1"],
        max: [5, "review should be less than or equal to 5"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "review should belong to a user"]
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
        required: [true, "review should belong to a tour"]
    }

},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: "tour",
    //     select: "name"
    // }).populate({
    //     path: "user",
    //     select: "name photo"
    // })
    this.populate({
        path: "user",
        select: "name photo"
    })
    next()
})

reviewSchema.statics.calculateAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: "$tour",
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" }

            }
        }
    ])
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    }
    else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

reviewSchema.post("save", function () {
    this.constructor.calculateAverageRatings(this.tour);
})

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne()
    next()
})
reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calculateAverageRatings(this.r.tour)
})

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

const Review = mongoose.model("Review", reviewSchema);


module.exports = Review