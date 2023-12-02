"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./routes/index"));
const morgan_1 = __importDefault(require("morgan"));
const errorController_1 = require("./controllers/errorController");
const appError_1 = require("./utils/appError");
const helmet_1 = __importDefault(require("helmet"));
const mongoSanitze = require("express-mongo-sanitize");
const xss = require('xss-clean');
dotenv_1.default.config();
exports.app = (0, express_1.default)();
exports.app.use((0, morgan_1.default)('dev'));
exports.app.use(express_1.default.json());
exports.app.use(mongoSanitze());
exports.app.use((0, helmet_1.default)());
exports.app.use(xss());
exports.app.use(index_1.default);
exports.app.use(errorController_1.ErrorHandler);
exports.app.all('*', (req, res, next) => {
    next(new appError_1.AppError(`Can't find ${req.originalUrl}`, 404));
});
