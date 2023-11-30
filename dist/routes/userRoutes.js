"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userControllers_1 = require("../controllers/userControllers");
const router = (0, express_1.Router)();
router.route('/').get(userControllers_1.getAllUsers).delete(userControllers_1.deleteUser);
router.route('/:id').get(userControllers_1.getUser);
exports.default = router;
