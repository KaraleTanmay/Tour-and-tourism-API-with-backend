const Tour = require('../models/tourModel');
const APIfeatures = require('../utils/apifeatures');
const appError = require('../utils/appErrors');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    console.log(req.query);
    next();
}

// routes handlers
exports.getAllTours = factory.getAll(Tour)

exports.getTourBYid = factory.getOne(Tour, { path: "reviews", select: "rating" })

exports.postTour = factory.createOne(Tour)

exports.patchTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour)

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        { $match: { ratingsAverage: { $gte: 4.5 } } },
        {
            $group: {
                _id: "$duration",
                numTours: { $sum: 1 },
                numRatings: { $sum: "$ratingsQuantity" },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }

    ]);

    res.status(200).json({
        status: "success",
        data: stats
    })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-01`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                numTourStarts: { $sum: 1 },
                tours: { $push: "$name" }
            }
        },
        {
            $addFields: { month: "$_id" }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: 1 }
        },
        // {
        //     $limit: 6
        // }

    ])

    res.status(200).json({
        status: "success",
        data: plan
    })
})

exports.getToursWithin = catchAsync(async (req, res, next) => {
    ///tours-within/:distance/center/:latlng/unit/:unit
    const { distance, latlng, unit } = req.params;

    if (!latlng) {
        return next(new appError("please provide lattitude and longitude saperated by comma", 400));
    }

    const [lat, lng] = latlng.split(",");
    const radius = ((unit === "mi") ? distance / 3963.2 : distance / 6378.1);

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    })

    res.status(200).json({
        status: "success",
        results: tours.length,
        data: tours
    })
})

exports.getTourDistances = catchAsync(async (req, res, next) => {

    const { latlng, unit } = req.params;

    if (!latlng) {
        return next(new appError("please provide lattitude and longitude saperated by comma", 400));
    }

    const [lat, lng] = latlng.split(",");
    const multiplier = ((unit === "mi") ? 0.000621371 : 0.001);

    const tours = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "point",
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: "distance",
                distanceMultiplier: multiplier
            },
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: "success",
        results: tours.length,
        data: tours
    })
})

// exports.checkId = (req, res, next, val) => {
//     if (req.params.id * 1 > tours.length) {
//         return res.status(400).json({
//             status: "fail",
//             message: "invalid id"
//         })
//     }
//     next();
// }