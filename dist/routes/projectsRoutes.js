"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
const router = (0, express_1.Router)();
router.route('/').get(projectController_1.getProjects).post(projectController_1.createProject);
router.route('/:id').get(projectController_1.getProject).delete(projectController_1.deleteProject).patch(projectController_1.updateProject);
exports.default = router;
