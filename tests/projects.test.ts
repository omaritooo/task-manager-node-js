import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { ObjectId } from 'mongoose';
import request from 'supertest';
import { app } from '..';
import { Users } from '../models/userModel';
import { IUser } from '../models/model';
import { Projects } from '../models/projectModel';
import { projectsSeed } from '../utils/seeders';

let mongo: any;

const authentication = async () => {
  const existingUser = await Users.create({
    name: 'User 4',
    email: 'user3@user.com',
    authentication: {
      password: 'testpassword',
      passwordConfirm: 'testpassword',
    },
  });
  return existingUser;
};

const seedingHelper = async (seeds: any, userId: ObjectId, model: any) => {
  for (let seed in seeds) {
    const project = new model(seeds[seed]);
    project.author = userId;
    await project.save();
  }
};

let token: string;
let user: IUser;
describe('Testing Project Endpoints', () => {
  beforeAll(async () => {
    const mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
      await collection.deleteMany({});
    }
    await authentication();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'user3@user.com',
      password: 'testpassword',
    });

    token = res.body.token;
    user = res.body.user;
    return { token };
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Get Projects', async () => {
    await seedingHelper(projectsSeed, user.id, Projects);

    const projects = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`);

    const { data, status } = projects.body;

    expect(projects.statusCode).toBe(200);
    expect(status).toBe('success');
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBe(9);
    expect(data.length).toEqual(projects.body.length);
  });
  describe('Getting project by ID', () => {
    it('Get Project', async () => {
      await seedingHelper(projectsSeed, user.id, Projects);
      const testProjectId = 2;
      const projects = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${token}`);

      const { data, status } = projects.body;

      expect(projects.statusCode).toBe(200);
      expect(status).toBe('success');
      expect(data.projectId).toEqual(testProjectId);
    });
    it('Project ID does not exist', async () => {
      await seedingHelper(projectsSeed, user.id, Projects);
      const testProjectId = 37;

      try {
        const projects = await request(app)
          .get(`/api/v1/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(projects.statusCode).toBe(404);
        const { data, status } = projects.body;
        expect(data).toBe(null);
        expect(status).toBe('error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  it('Update project data', async () => {
    await seedingHelper(projectsSeed, user.id, Projects);
    const mockProjectId = 3;
    const updatedValue = {
      name: 'New Project name',
      paused: false,
    };

    const projects = await request(app)
      .patch(`/api/v1/projects/${mockProjectId}`)
      .send(updatedValue)
      .set('Authorization', `Bearer ${token}`);

    const { data, status } = projects.body;
    expect(projects.status).toBe(200);
    expect(data.name).toBe(updatedValue.name);
    expect(data.paused).toBe(updatedValue.paused);
  });
  it('Delete project', async () => {
    await seedingHelper(projectsSeed, user.id, Projects);
    const mockProjectId = 3;

    const projects = await request(app)
      .delete(`/api/v1/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`);
    const { message, status } = projects.body;

    expect(projects.status).toBe(200);
    expect(status).toBe('success');
    expect(message).toBe('Project 7 deleted.');
    // expect(data.projectId).toBe(mockProjectId);
  });
  describe('Adding new Project', () => {
    it('Successfully posting a new project', async () => {
      const newProject = new Projects({
        name: 'Project 6',
        description: 'This is a new test project',
        paused: true,
      });
      const response = await request(app)
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
    });
    it('Adding a project that already exists', async () => {
      try {
        await seedingHelper(projectsSeed, user.id, Projects);
        const userProject = {
          name: 'Project 6',
          description: 'This is a new test project',
          paused: true,
        };
        const project = new Projects(userProject);
        project.author = user.id;
        await project.save();
        const response = request(app)
          .post('/api/v1/projects')
          .send({
            name: 'Project 6',
            description: 'This is a new test project',
            paused: true,
          })
          .set('Authorization', `Bearer ${token}`);
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('Filteration test', () => {
    it('Sort by name', async () => {
      await seedingHelper(projectsSeed, user.id, Projects);
      const projects = await request(app)
        .get('/api/v1/projects?sort=name')
        .set('Authorization', `Bearer ${token}`);
      const { data, status } = projects.body;
      expect(projects.statusCode).toBe(200);
      expect(status).toBe('success');
      expect(data[0].name).toBe('Project 1');
      expect(data.length).toEqual(projects.body.length);
    });
    it('Select specific fields', async () => {
      await seedingHelper(projectsSeed, user.id, Projects);

      const projects = await request(app)
        .get('/api/v1/projects?fields=name,projectId')
        .set('Authorization', `Bearer ${token}`);
      const { data, status } = projects.body;
      expect(projects.statusCode).toBe(200);
      expect(data.length).toEqual(projects.body.length);
      expect(Object.keys(data[0])).toContain('name');
      expect(Object.keys(data[0])).toContain('projectId');
      expect(Object.keys(data[0])).not.toContain('description');
    });
    it('Pagination and limiting', async () => {
      await seedingHelper(projectsSeed, user.id, Projects);
      const testLimit = '4';
      const testPage = '1';
      const projects = await request(app)
        .get(`/api/v1/projects?limit=${testLimit}&page=${testPage}`)
        .set('Authorization', `Bearer ${token}`);
      const { data, status, length, limit, page } = projects.body;
      expect(projects.statusCode).toBe(200);
      expect(data.length).toEqual(length);
      expect(status).toBe('success');
      expect(limit).toEqual(testLimit);
      expect(page).toEqual(testPage);
    });
  });
});
