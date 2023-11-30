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
exports.deleteUser = exports.getUser = exports.getAllUsers = void 0;
const helperFunctions_1 = require("../utils/helperFunctions");
const userModel_1 = require("../models/userModel");
const catchAsync_1 = require("../utils/catchAsync");
exports.getAllUsers = (0, helperFunctions_1.getAll)(userModel_1.Users, true);
exports.getUser = (0, helperFunctions_1.getOne)(userModel_1.Users, 'user');
exports.deleteUser = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = res.locals;
    const value = yield userModel_1.Users.findByIdAndDelete(user.id);
    res.status(200).json({
        status: 'success',
        value,
    });
}));
