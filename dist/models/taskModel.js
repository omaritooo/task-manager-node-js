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
exports.Tasks = void 0;
const mongoose_1 = require("mongoose");
const auto_increment_1 = require("@typegoose/auto-increment");
const mongodb_1 = require("mongodb");
const projectModel_1 = require("./projectModel");
const appError_1 = require("../utils/appError");
const taskSchema = new mongoose_1.Schema({
    taskId: {
        type: Number,
    },
    projectId: {
        type: Number,
        required: [true, 'A task must be linked to a project'],
    },
    project: {
        ref: 'projects',
        type: mongodb_1.ObjectId,
    },
    author: {
        ref: 'users',
        type: mongodb_1.ObjectId,
    },
    assignedTo: {
        ref: 'users',
        type: mongodb_1.ObjectId,
    },
    name: {
        type: String,
        required: [true, 'A task must have a name'],
        maxLength: [40, 'This name exceeds the max length of 40 characters'],
        minLength: [6, 'This name exceeds the min length of 10 characters'],
    },
    description: {
        type: String,
        default: '',
    },
    priority: {
        type: String,
        required: [true, 'A priority level is required'],
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: 'Priority must either be: low, medium, high or urgent ',
        },
        default: 'low',
    },
    estimatedTime: {
        type: Date,
        required: [true, 'A time estimate is required'],
    },
    status: {
        type: String,
        enum: {
            values: ['backlog', 'in progress', 'done'],
            message: 'Status must be one of backlog, in progress and done',
        },
        default: 'backlog',
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
taskSchema.plugin(auto_increment_1.AutoIncrementID, { field: 'taskId', startAt: 1 });
taskSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield projectModel_1.Projects.findOneAndUpdate({ projectId: this.projectId }, { $push: { tasks: this._id } });
        if (!result) {
            next(new appError_1.AppError('Project ID does not exist', 403));
        }
        if (this.assignedTo === null) {
            this.assignedTo === this.author;
        }
        next();
    });
});
taskSchema.post('findOne', function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (doc) {
            yield doc.populate([
                { path: 'author', select: 'name email _id userId' },
                { path: 'project', select: 'name description projectId createdAt' },
                { path: 'assignedTo', select: 'name email _id userId' },
            ]);
        }
    });
});
taskSchema.post('find', function (docs) {
    return __awaiter(this, void 0, void 0, function* () {
        if (docs) {
            for (const doc in docs) {
                yield docs[doc].populate([
                    { path: 'author', select: 'name email _id  userId' },
                    { path: 'project', select: 'name description projectId createdAt' },
                    { path: 'assignedTo', select: 'name email _id  userId' },
                ]);
            }
        }
    });
});
taskSchema.pre('findOneAndUpdate', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const updateDocument = this.getUpdate();
        const modifiedFields = Object.keys(updateDocument);
        if (modifiedFields.includes('assignedTo')) {
            const Project = yield projectModel_1.Projects.findOneAndUpdate({ projectId: updateDocument.projectId }, { $addToSet: { contributors: updateDocument.assignedTo } });
        }
    });
});
taskSchema.index({ taskId: 1 }, {
    unique: true,
    sparse: true,
});
exports.Tasks = (0, mongoose_1.model)('tasks', taskSchema);
