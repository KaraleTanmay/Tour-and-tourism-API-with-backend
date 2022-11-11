const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
// const User = require('./userModel');

// creating schema for database collection
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "the tour should have name"],
        unique: true,
        trim: true,
        minlength: [5, "a tour must have name longer than 5 characters"],
        maxlength: [30, "a tour must have name less than 30 characters"]
    },
    slug: {
        type: String
    },
    duration: {
        type: Number,
        required: [true, "a string must have duration in days"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "a string must have griup size"]
    },
    difficulty: {
        type: String,
        required: [true, "a string must have difficulty rating"],
        enum: {
            values: ["easy", "medium", "difficult"],
            message: "ony easy,medium and difficult are allowed"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.0,
        min: [1, "rating must be more than 1"],
        max: [5, "rating must be less than 5"],
        set: (value) => {
            return Math.round(value * 10) / 10;
        }
    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, "mention the price of tour"],
    },
    discountedPrice: {
        type: Number,
        validate: {
            validator: function (value) {
                return this.price < value;
            },
            message: "discounted price should be less than actual price"
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, "a string must have sumary"]
    },
    description: {
        type: String,
        trim: true,
        required: [true, "a string must have sumary"]
    },
    startLocation: {
        // GeoJson
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    imageCover: {
        type: String,
        required: [true, "a string must have image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    // guides: Array
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" })

tourSchema.virtual("durationWeeks").get(function () {
    return this.duration / 7;
})

tourSchema.virtual("reviews", {
    ref: "Review",
    foreignField: "tour",
    localField: "_id"
})

tourSchema.pre("save", function (next) {
    this.slug = slugify(this.name);
    next()
})

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v -passwordChangedAt"
    });
    next()
})

// tourSchema.pre("save", async function (next) {
//     const guidePromises = this.guides.map(async (id) => {
//         return await User.findById(id);
//     })
//     this.guides = await Promise.all(guidePromises);
//     next()
// })

// creating model form schema
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;