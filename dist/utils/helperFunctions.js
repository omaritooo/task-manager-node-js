"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOne = exports.deleteOne = exports.createOne = exports.getOne = exports.getAll = void 0;
const apiFeatures_1 = require("./apiFeatures");
const catchAsync_1 = require("./catchAsync");
const appError_1 = require("./appError");
const http_status_codes_1 = require("http-status-codes");
const getAll = (model, userFlag = false) => (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let query = {};
    if (!userFlag) {
        query = {
            author: res.locals.user._id,
        };
    }
    const features = new apiFeatures_1.ApiFeatures(model.find(query), req.query)
        .limitFields()
        .search()
        .sort()
        .filter()
        .paginate();
    const response = yield features.query;
    res.status(200).json({
        status: 'success',
        length: response.length,
        data: response,
        page: req.query.page,
        limit: req.query.limit,
    });
}));
exports.getAll = getAll;
const getOne = (model, getVal = '') => (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.user._id;
    const { id } = req.params;
    const idVal = {
        project: model.findOne({
            projectId: id,
            $or: [{ author: userId }, { contributors: { $in: [userId] } }],
        }),
        task: yield model.findOne({
            taskId: id,
            $or: [{ author: userId }, { contributors: { $in: [userId] } }],
        }),
        user: yield model.findOne({
            userId: id,
        }),
    };
    const result = yield idVal[getVal];
    if (!result) {
        res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
            status: 'error',
            message: 'Item with ID is not found.',
            data: null,
        });
        // next(new AppError('Invalid ID', 404));
    }
    else {
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: 'success',
            data: result,
        });
    }
}));
exports.getOne = getOne;
const createOne = (model) => (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield model.create(Object.assign(Object.assign({}, req.body), { author: res.locals.user._id }));
    res.status(200).json({
        status: 'success',
        data: results,
    });
}));
exports.createOne = createOne;
const deleteOne = (model, deleteVal = '') => (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let results;
    const userId = res.locals.user._id;
    if (deleteVal === 'projectId') {
        results = yield model.findOneAndDelete({
            projectId: req.params.id,
            author: userId,
        });
    }
    else {
        results = yield model.findOneAndDelete({
            taskId: req.params.id,
            author: userId,
        });
    }
    if (!results) {
        next(new appError_1.AppError('No task found with that ID', 404));
    }
    else {
        res.status(200).json({
            status: 'success',
            message: `${results.name} deleted.`,
        });
    }
}));
exports.deleteOne = deleteOne;
const updateOne = (model, getVal = '') => (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.user._id;
    const idVal = {
        project: yield model.findOneAndUpdate({
            projectId: req.params.id,
            $or: [{ author: userId }, { contributors: { $in: [userId] } }],
        }, req.body, {
            new: true,
            runValidators: true,
        }),
        task: yield model.findOneAndUpdate({
            taskId: req.params.id,
            projectId: req.body.projectId,
            $or: [{ author: userId }, { contributors: { $in: [userId] } }],
        }, req.body, {
            runValidators: true,
        }),
        user: 'userId',
    };
    const result = yield idVal[getVal];
    res.status(200).json({
        status: 'success',
        data: result,
    });
}));
exports.updateOne = updateOne;
