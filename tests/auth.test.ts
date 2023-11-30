import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '..';
import bcrypt from 'bcrypt';
import { Users } from '../models/userModel';

let mongo: any;
describe('Auth API tests', () => {
  beforeAll(async () => {
    const mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
      await collection.deleteMany({});
    }
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('create user', async () => {
    const newUser = {
      name: 'User 2',
      email: 'user2@user.com',
      password: 'testpassword',
      passwordConfirm: 'testpassword',
    };
    const res = await request(app).post('/api/v1/auth/signup').send(newUser);

    const { user, token } = res.body;

    expect(res.statusCode).toBe(201);
    expect(user.name).toBe(newUser.name);
    expect(user.email).toBe(newUser.email);
  });
  it('test login', async () => {
    const existingUser = await Users.create({
      name: 'User 4',
      email: 'user3@user.com',
      authentication: {
        password: 'testpassword',
        passwordConfirm: 'testpassword',
      },
    });
    try {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'user3@user.com',
        password: 'testpassword',
      });
      const { user, token } = res.body;
      expect(res.statusCode).toBe(200);
      expect(token).not.toBe(' ');
      expect(user.name).toBe(existingUser.name);
      expect(user.email).toBe(existingUser.email);
    } catch (err) {
      throw new Error(err as string);
    }
  });

  it('Wrong credentials', async () => {
    const existingUser = await Users.create({
      name: 'User 4',
      email: 'user3@user.com',
      authentication: {
        password: 'testpassword',
        passwordConfirm: 'testpassword',
      },
    });

    try {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user3@user.com',
          password: 'testssspassword',
        })
        .end(function (err, res) {
          if (err) throw err;
        });

      expect(res.statusCode).toBe(403);

      const { user, token } = res.body;
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });
  it('Delete user', async () => {
    const existingUser = await Users.create({
      name: 'User 4',
      email: 'user3@user.com',
      authentication: {
        password: 'testpassword',
        passwordConfirm: 'testpassword',
      },
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'user3@user.com',
      password: 'testpassword',
    });
    const { token } = loginRes.body;

    try {
      await request(app)
        .delete('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      throw new Error(err as string);
    }
  });
});
