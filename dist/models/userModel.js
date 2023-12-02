"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Users = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const auto_increment_1 = require("@typegoose/auto-increment");
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const mongodb_1 = require("mongodb");
const projectModel_1 = require("./projectModel");
const userSchema = new mongoose_1.Schema({
    userId: {
        type: Number,
    },
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        unique: true,
        trim: true,
        maxLength: [40, 'This name exceeds the max length of 40 characters'],
        minLength: [6, 'This name exceeds the min length of 10 characters'],
    },
    authentication: {
        password: {
            type: String,
            required: true,
            select: false,
        },
        passwordConfirm: {
            type: String || undefined,
            required: true,
            select: false,
        },
        salt: {
            type: String,
            select: false,
        },
        jwt: {
            type: String,
            select: false,
            default: null,
            required: false,
        },
    },
    email: {
        type: String,
        required: [true, 'A user email is required.'],
        validate: [validator_1.default.isEmail, 'Please provide a valid email'],
        lowercase: true,
    },
    projects: [
        {
            project: {
                type: mongodb_1.ObjectId,
                ref: 'projects',
            },
            permission: {
                type: String,
                enum: ['author', 'contributor'],
                default: 'author',
            },
        },
    ],
    photo: {
        type: String,
        enum: ['one', 'two', 'three', 'none'],
        default: 'none',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.plugin(auto_increment_1.AutoIncrementID, { field: 'userId', startAt: 1 });
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('authentication.password')) {
            return next();
        }
        this.authentication.password = yield bcrypt_1.default.hash(this.authentication.password, 12);
        this.authentication.passwordConfirm = undefined;
        next();
    });
});
userSchema.methods.correctPassword = function (candidatePassword, userPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(candidatePassword, userPassword);
    });
};
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
};
userSchema.pre('validate', function (next) {
    if (this.authentication.password !== this.authentication.passwordConfirm) {
        this.invalidate('passwordConfirmation', 'enter the same password');
    }
    next();
});
userSchema.post('findOneAndDelete', function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = doc;
        const mappedIds = user.projects
            .map((el) => (el.permission === 'author' ? el.project : undefined))
            .filter((name) => name !== undefined);
        const deletion = yield projectModel_1.Projects.deleteMany({
            _id: { $in: mappedIds },
        });
    });
});
userSchema.index({ userId: 1 }, {
    unique: true,
    sparse: true,
});
exports.Users = mongoose_1.default.model('users', userSchema);
