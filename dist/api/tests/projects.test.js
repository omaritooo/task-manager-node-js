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
const seeders_1 = require("../../utils/seeders");
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
    it('Get Projects', () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
        const projects = yield (0, supertest_1.default)(__1.app)
            .get('/api/v1/projects')
            .set('Authorization', `Bearer ${token}`);
        const { data, status } = projects.body;
        expect(projects.statusCode).toBe(200);
        expect(status).toBe('success');
        expect(data).toBeInstanceOf(Array);
        expect(data.length).toBe(9);
        expect(data.length).toEqual(projects.body.length);
    }));
    describe('Getting project by ID', () => {
        it('Get Project', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
            const testProjectId = 2;
            const projects = yield (0, supertest_1.default)(__1.app)
                .get(`/api/v1/projects/${testProjectId}`)
                .set('Authorization', `Bearer ${token}`);
            const { data, status } = projects.body;
            expect(projects.statusCode).toBe(200);
            expect(status).toBe('success');
            expect(data.projectId).toEqual(testProjectId);
        }));
        it('Project ID does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
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
    it('Update project data', () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
        const mockProjectId = 3;
        const updatedValue = {
            name: 'New Project name',
            paused: false,
        };
        const projects = yield (0, supertest_1.default)(__1.app)
            .patch(`/api/v1/projects/${mockProjectId}`)
            .send(updatedValue)
            .set('Authorization', `Bearer ${token}`);
        const { data, status } = projects.body;
        expect(projects.status).toBe(200);
        expect(data.name).toBe(updatedValue.name);
        expect(data.paused).toBe(updatedValue.paused);
    }));
    it('Delete project', () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
        const mockProjectId = 3;
        const projects = yield (0, supertest_1.default)(__1.app)
            .delete(`/api/v1/projects/${mockProjectId}`)
            .set('Authorization', `Bearer ${token}`);
        const { message, status } = projects.body;
        expect(projects.status).toBe(200);
        expect(status).toBe('success');
        expect(message).toBe('Project 7 deleted.');
        // expect(data.projectId).toBe(mockProjectId);
    }));
    describe('Adding new Project', () => {
        it('Successfully posting a new project', () => __awaiter(void 0, void 0, void 0, function* () {
            const newProject = new projectModel_1.Projects({
                name: 'Project 6',
                description: 'This is a new test project',
                paused: true,
            });
            const response = yield (0, supertest_1.default)(__1.app)
                .post('/api/v1/projects')
                .send({
                name: 'Project 6',
                description: 'This is a new test project',
                paused: true,
            })
                .set('Authorization', `Bearer ${token}`);
            const { status, data } = response.body;
            expect(response.statusCode).toBe(200);
            expect(data).not.toBe(null);
            expect(status).toBe('success');
            expect(data.name).toBe(newProject.name);
        }));
        it('Adding a project that already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
                const userProject = {
                    name: 'Project 6',
                    description: 'This is a new test project',
                    paused: true,
                };
                const project = new projectModel_1.Projects(userProject);
                project.author = user.id;
                yield project.save();
                const response = (0, supertest_1.default)(__1.app)
                    .post('/api/v1/projects')
                    .send({
                    name: 'Project 6',
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
            yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
            const projects = yield (0, supertest_1.default)(__1.app)
                .get('/api/v1/projects?sort=name')
                .set('Authorization', `Bearer ${token}`);
            const { data, status } = projects.body;
            expect(projects.statusCode).toBe(200);
            expect(status).toBe('success');
            expect(data[0].name).toBe('Project 1');
            expect(data.length).toEqual(projects.body.length);
        }));
        it('Select specific fields', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
            const projects = yield (0, supertest_1.default)(__1.app)
                .get('/api/v1/projects?fields=name,projectId')
                .set('Authorization', `Bearer ${token}`);
            const { data, status } = projects.body;
            expect(projects.statusCode).toBe(200);
            expect(data.length).toEqual(projects.body.length);
            expect(Object.keys(data[0])).toContain('name');
            expect(Object.keys(data[0])).toContain('projectId');
            expect(Object.keys(data[0])).not.toContain('description');
        }));
        it('Pagination and limiting', () => __awaiter(void 0, void 0, void 0, function* () {
            yield seedingHelper(seeders_1.projectsSeed, user.id, projectModel_1.Projects);
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
