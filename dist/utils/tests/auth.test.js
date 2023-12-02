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
let mongo;
describe('Auth API tests', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const mongo = yield mongodb_memory_server_1.MongoMemoryServer.create();
        yield mongoose_1.default.connect(mongo.getUri());
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const collections = yield mongoose_1.default.connection.db.collections();
        for (let collection of collections) {
            yield collection.deleteMany({});
        }
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    it('create user', () => __awaiter(void 0, void 0, void 0, function* () {
        const newUser = {
            name: 'User 2',
            email: 'user2@user.com',
            password: 'testpassword',
            passwordConfirm: 'testpassword',
        };
        const res = yield (0, supertest_1.default)(__1.app).post('/api/v1/auth/signup').send(newUser);
        const { user, token } = res.body;
        expect(res.statusCode).toBe(201);
        expect(user.name).toBe(newUser.name);
        expect(user.email).toBe(newUser.email);
    }));
    it('test login', () => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = yield userModel_1.Users.create({
            name: 'User 4',
            email: 'user3@user.com',
            authentication: {
                password: 'testpassword',
                passwordConfirm: 'testpassword',
            },
        });
        try {
            const res = yield (0, supertest_1.default)(__1.app).post('/api/v1/auth/login').send({
                email: 'user3@user.com',
                password: 'testpassword',
            });
            const { user, token } = res.body;
            expect(res.statusCode).toBe(200);
            expect(token).not.toBe(' ');
            expect(user.name).toBe(existingUser.name);
            expect(user.email).toBe(existingUser.email);
        }
        catch (err) {
            throw new Error(err);
        }
    }));
    it('Wrong credentials', () => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = yield userModel_1.Users.create({
            name: 'User 4',
            email: 'user3@user.com',
            authentication: {
                password: 'testpassword',
                passwordConfirm: 'testpassword',
            },
        });
        try {
            const res = yield (0, supertest_1.default)(__1.app)
                .post('/api/v1/auth/login')
                .send({
                email: 'user3@user.com',
                password: 'testssspassword',
            })
                .end(function (err, res) {
                if (err)
                    throw err;
            });
            expect(res.statusCode).toBe(403);
            const { user, token } = res.body;
        }
        catch (err) {
            expect(err).toBeInstanceOf(Error);
        }
    }));
    it('Delete user', () => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = yield userModel_1.Users.create({
            name: 'User 4',
            email: 'user3@user.com',
            authentication: {
                password: 'testpassword',
                passwordConfirm: 'testpassword',
            },
        });
        const loginRes = yield (0, supertest_1.default)(__1.app).post('/api/v1/auth/login').send({
            email: 'user3@user.com',
            password: 'testpassword',
        });
        const { token } = loginRes.body;
        try {
            yield (0, supertest_1.default)(__1.app)
                .delete('/api/v1/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .catch((err) => {
                throw err;
            });
        }
        catch (err) {
            throw new Error(err);
        }
    }));
});
