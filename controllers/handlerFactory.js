const APIfeatures = require("../utils/apifeatures");
const appError = require("../utils/appErrors");
const catchAsync = require("../utils/catchAsync");

exports.deleteOne = (model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new appError("invalid id", 404));
        }
        res.status(204).json({
            status: "success",
            data: null
        })
    })
}

exports.updateOne = (model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
        if (!doc) {
            return next(new appError("invalid id", 404));
        }
        res.status(200).json({
            status: "success",
            data: {
                doc
            }
        })
    })
}

exports.createOne = (model) => {
    return catchAsync(async (req, res, next) => {
        const newdoc = await model.create(req.body);
        res.status(200).json({
            status: "success",
            data: newdoc
        })
    })
}

exports.getOne = (model, populateOptions) => {
    return catchAsync(async (req, res, next) => {
        let query = model.findById(req.params.id);
        if (populateOptions) {
            query = query.populate(populateOptions);
        }
        const doc = await query;

        if (!doc) {
            return next(new appError("invalid id", 404));
        }

        res.status(200).json({
            status: "success",
            data: {
                doc
            }
        })
    })

}

exports.getAll = (model) => {
    return catchAsync(async (req, res, next) => {

        // to get nested route results for reviews
        let filter = {}
        if (req.params.tourId) {
            filter = { tour: req.params.tourId };
        }

        const features = new APIfeatures(model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const doc = await features.query;
        // const doc = await features.query.explain();

        res.status(200).json({
            status: "success",
            results: doc.length,
            data: doc
        });
    })
}