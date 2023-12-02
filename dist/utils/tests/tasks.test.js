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
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const __1 = require("../..");
const userModel_1 = require("../../models/userModel");
const projectModel_1 = require("../../models/projectModel");
const seeders_1 = require("../seeders");
const taskModel_1 = require("../../models/taskModel");
let mongo;
const authentication = () => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield userModel_1.Users.create({
        name: 'User 4',
        email: 'user3@user.com',
        authentication: {
            password: 'testpassword',
            passwordConfirm: 'testpassword',
        },
    });
    return existingUser;
});
const seedingHelper = (seeds, userId, model) => __awaiter(void 0, void 0, void 0, function* () {
    for (let seed in seeds) {
        const project = new model(seeds[seed]);
        project.author = userId;
        yield project.save();
    }
});
let token;
let user;
describe('Testing Project Endpoints', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const mongo = yield mongodb_memory_server_1.MongoMemoryServer.create();
        yield mongoose_1.default.connect(mongo.getUri());
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const collections = yield mongoose_1.default.connection.db.collections();
        for (let collection of collections) {
            yield collection.deleteMany({});
        }
        yield authentication();
        const res = yield (0, supertest_1.default)(__1.app).post('/api/v1/auth/login').send({
            email: 'user3@user.com',
            password: 'testpassword',
        });
        token = res.body.token;
        user = res.body.user;
        return { token };
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    it('Get Tasks', () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
        yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
        const tasks = yield (0, supertest_1.default)(__1.app)
            .get('/api/v1/Tasks')
            .set('Authorization', `Bearer ${token}`);
        const { data, status } = tasks.body;
        expect(tasks.statusCode).toBe(200);
        expect(status).toBe('success');
        expect(data).toBeInstanceOf(Array);
        expect(data.length).toEqual(tasks.body.length);
    }));
    it('Get Tasks in a specific project', () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
        yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
        const projectId = 1;
        const tasks = yield (0, supertest_1.default)(__1.app)
            .get(`/api/v1/tasks/project/${projectId}`)
            .set('Authorization', `Bearer ${token}`);
        const { data, status } = tasks.body;
        expect(tasks.statusCode).toBe(200);
        expect(status).toBe('success');
        expect(data).toBeInstanceOf(Array);
        expect(data.length).toEqual(tasks.body.length);
        data.forEach((element) => {
            expect(element.projectId).toBe(projectId);
        });
    }));
    describe('Getting task by ID', () => {
        it('Get Task', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
            yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
            const testTaskID = 2;
            const projects = yield (0, supertest_1.default)(__1.app)
                .get(`/api/v1/tasks/${testTaskID}`)
                .set('Authorization', `Bearer ${token}`);
            const { data, status } = projects.body;
            expect(projects.statusCode).toBe(200);
            expect(status).toBe('success');
            expect(data.taskId).toEqual(testTaskID);
        }));
        it('Project ID does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
            yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
            const testProjectId = 37;
            try {
                const projects = yield (0, supertest_1.default)(__1.app)
                    .get(`/api/v1/projects/${testProjectId}`)
                    .set('Authorization', `Bearer ${token}`);
                expect(projects.statusCode).toBe(404);
                const { data, status } = projects.body;
                expect(data).toBe(null);
                expect(status).toBe('error');
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
            }
        }));
    });
    it('Update task data', () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
        yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
        const mockTaskId = 3;
        const updatedValue = {
            name: 'New Task name',
            projectId: 1,
            paused: false,
        };
        const tasks = yield (0, supertest_1.default)(__1.app)
            .patch(`/api/v1/tasks/${mockTaskId}`)
            .send(updatedValue)
            .set('Authorization', `Bearer ${token}`);
        const { data } = tasks.body;
        expect(tasks.status).toBe(200);
        expect(data.name).toBe(updatedValue.name);
    }));
    it('Delete task', () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
        yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
        const mockTaskId = 3;
        const tasks = yield (0, supertest_1.default)(__1.app)
            .delete(`/api/v1/tasks/${mockTaskId}`)
            .set('Authorization', `Bearer ${token}`);
        const { message, status } = tasks.body;
        expect(tasks.status).toBe(200);
        expect(status).toBe('success');
        expect(message).toBe('Task 3 deleted.');
    }));
    describe('Adding new task', () => {
        it('Successfully posting a new task', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
            const newTask = new taskModel_1.Tasks({
                name: 'Task 6',
                projectId: 1,
                description: 'This is a new test project',
                estimatedTime: '2023-10-06T01:41:27.971Z',
                priority: 'high',
            });
            const response = yield (0, supertest_1.default)(__1.app)
                .post('/api/v1/tasks')
                .send({
                name: 'Task 6',
                projectId: 1,
                description: 'This is a new test project',
                estimatedTime: '2023-10-06T01:41:27.971Z',
                priority: 'high',
            })
                .set('Authorization', `Bearer ${token}`);
            const { status, data } = response.body;
            expect(response.statusCode).toBe(200);
            expect(data).not.toBe(null);
            expect(status).toBe('success');
            expect(data.name).toBe(newTask.name);
        }));
        it('Adding a Task that already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
                yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
                const userProject = {
                    name: 'Task 6',
                    projectId: 2,
                    description: 'This is a new test task',
                    paused: true,
                };
                const project = new projectModel_1.Projects(userProject);
                project.author = user.id;
                yield project.save();
                const response = (0, supertest_1.default)(__1.app)
                    .post('/api/v1/tasks')
                    .send({
                    name: 'Task 6',
                    projectId: 2,
                    description: 'This is a new test project',
                    paused: true,
                })
                    .set('Authorization', `Bearer ${token}`);
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
            }
        }));
    });
    describe('Filteration test', () => {
        it('Sort by name', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
            yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
            const projects = yield (0, supertest_1.default)(__1.app)
                .get('/api/v1/tasks?sort=name')
                .set('Authorization', `Bearer ${token}`);
            const { data, status } = projects.body;
            expect(projects.statusCode).toBe(200);
            expect(status).toBe('success');
            expect(data[0].name).toBe('Task 1');
            expect(data.length).toEqual(projects.body.length);
        }));
        it('Select specific fields', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
            yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
            const projects = yield (0, supertest_1.default)(__1.app)
                .get('/api/v1/tasks?fields=name,projectId')
                .set('Authorization', `Bearer ${token}`);
            const { data, status } = projects.body;
            expect(projects.statusCode).toBe(200);
            expect(data.length).toEqual(projects.body.length);
            expect(Object.keys(data[0])).toContain('name');
            expect(Object.keys(data[0])).toContain('projectId');
            expect(Object.keys(data[0])).not.toContain('description');
        }));
        it('Pagination and limiting', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.tasksSeed.projects, user.id, projectModel_1.Projects);
            yield seedingHelper(seeders_1.tasksSeed.tasks, user.id, taskModel_1.Tasks);
            const testLimit = '4';
            const testPage = '1';
            const projects = yield (0, supertest_1.default)(__1.app)
                .get(`/api/v1/projects?limit=${testLimit}&page=${testPage}`)
                .set('Authorization', `Bearer ${token}`);
            const { data, status, length, limit, page } = projects.body;
            expect(projects.statusCode).toBe(200);
            expect(data.length).toEqual(length);
            expect(status).toBe('success');
            expect(limit).toEqual(testLimit);
            expect(page).toEqual(testPage);
        }));
    });
});
