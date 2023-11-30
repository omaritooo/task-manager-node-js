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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Projects = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auto_increment_1 = require("@typegoose/auto-increment");
const mongodb_1 = require("mongodb");
const taskModel_1 = require("./taskModel");
const userModel_1 = require("./userModel");
const projectSchema = new mongoose_1.default.Schema({
    projectId: {
        type: Number,
    },
    author: {
        ref: 'users',
        type: mongodb_1.ObjectId,
    },
    name: {
        type: String,
        required: [true, 'A project must have a name'],
        maxLength: [40, 'This project exceeds the max length of 40 characters'],
        minLength: [6, 'This project exceeds the min length of 10 characters'],
    },
    description: {
        type: String,
        default: '',
        maxLength: [500, 'A description must not exceed 500 characters.'],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    contributors: [
        {
            ref: 'users',
            type: mongodb_1.ObjectId,
        },
    ],
    tasks: [
        {
            ref: 'tasks',
            type: mongodb_1.ObjectId,
        },
    ],
    paused: {
        type: Boolean,
        default: true,
    },
}, {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
projectSchema.plugin(auto_increment_1.AutoIncrementID, { field: 'projectId', startAt: 1 });
projectSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield userModel_1.Users.findByIdAndUpdate(this.author, {
            $addToSet: {
                projects: {
                    project: this._id,
                    permission: 'author',
                },
            },
        });
        const contributingUser = yield userModel_1.Users.findByIdAndUpdate(this.contributors[0], {
            $addToSet: {
                projects: {
                    project: this._id,
                    permission: 'contributor',
                },
            },
        });
        next();
    });
});
projectSchema.post('findOne', function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (doc) {
            yield doc.populate([
                { path: 'tasks', select: '' },
                { path: 'author', select: 'name userId _id email' },
                { path: 'contributors', select: 'name userId _id email' },
            ]);
        }
    });
});
projectSchema.post('find', function (docs) {
    return __awaiter(this, void 0, void 0, function* () {
        if (docs) {
            for (const doc in docs) {
                yield docs[doc].populate([
                    { path: 'tasks', select: '' },
                    { path: 'author', select: 'name userId _id email' },
                    { path: 'contributors', select: 'name userId _id email' },
                ]);
            }
        }
    });
});
projectSchema.post('findOneAndDelete', function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const project = doc;
        if (project.tasks.length > 0) {
            yield taskModel_1.Tasks.deleteMany({ _id: { $in: project.tasks } }).exec();
        }
        yield userModel_1.Users.updateOne({ _id: project.author }, {
            $pull: {
                projects: {
                    project: project._id,
                },
            },
        });
    });
});
projectSchema.post('deleteMany', function (doc) {
    return __awaiter(this, void 0, void 0, function* () { });
});
projectSchema.index({ name: 1, author: 1 }, {
    unique: true,
    sparse: true,
});
exports.Projects = mongoose_1.default.model('projects', projectSchema);
