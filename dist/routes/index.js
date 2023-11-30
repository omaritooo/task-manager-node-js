"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskRoutes_1 = __importDefault(require("./taskRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const projectsRoutes_1 = __importDefault(require("./projectsRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.use('/api/v1/tasks', authController_1.protectRoute, taskRoutes_1.default);
router.use('/api/v1/users', authController_1.protectRoute, userRoutes_1.default);
router.use('/api/v1/auth', authRoutes_1.default);
router.use('/api/v1/projects', authController_1.protectRoute, projectsRoutes_1.default);
exports.default = router;
