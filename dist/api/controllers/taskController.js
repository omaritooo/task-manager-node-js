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
exports.assignTask = exports.getProjectTasks = exports.deleteTask = exports.createTask = exports.updateTask = exports.getTask = exports.getTasks = void 0;
const taskModel_1 = require("../../models/taskModel");
const catchAsync_1 = require("../../utils/catchAsync");
const helperFunctions_1 = require("../../utils/helperFunctions");
const userModel_1 = require("../../models/userModel");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const apiFeatures_1 = require("../../utils/apiFeatures");
exports.getTasks = (0, helperFunctions_1.getAll)(taskModel_1.Tasks);
exports.getTask = (0, helperFunctions_1.getOne)(taskModel_1.Tasks, 'task');
exports.updateTask = (0, helperFunctions_1.updateOne)(taskModel_1.Tasks, 'task');
exports.createTask = (0, helperFunctions_1.createOne)(taskModel_1.Tasks);
exports.deleteTask = (0, helperFunctions_1.deleteOne)(taskModel_1.Tasks, 'task');
exports.getProjectTasks = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const features = new apiFeatures_1.ApiFeatures(taskModel_1.Tasks.find({ projectId: id }), req.query)
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
exports.assignTask = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, taskId } = req.params;
    const User = yield userModel_1.Users.findOne({ userId: userId });
    if (!User) {
        next(new appError_1.AppError('User does not exist', http_status_codes_1.StatusCodes.NOT_FOUND));
    }
    const Task = yield taskModel_1.Tasks.findOneAndUpdate({
        taskId: taskId,
        author: res.locals.user.id,
    }, {
        assignedTo: User ? User._id : null,
    });
    res.status(200).json({ status: 'OK', Task });
}));
