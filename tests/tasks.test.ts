import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { ObjectId } from 'mongoose';
import request from 'supertest';
import { app } from '..';
import { Users } from '../models/userModel';
import { IUser } from '../models/model';
import { Projects } from '../models/projectModel';
import { tasksSeed } from '../utils/seeders';
import { Tasks } from '../models/taskModel';

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

  it('Get Tasks', async () => {
    await seedingHelper(tasksSeed.projects, user.id, Projects);
    await seedingHelper(tasksSeed.tasks, user.id, Tasks);

    const tasks = await request(app)
      .get('/api/v1/Tasks')
      .set('Authorization', `Bearer ${token}`);

    const { data, status } = tasks.body;

    expect(tasks.statusCode).toBe(200);
    expect(status).toBe('success');
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toEqual(tasks.body.length);
  });
  it('Get Tasks in a specific project', async () => {
    await seedingHelper(tasksSeed.projects, user.id, Projects);
    await seedingHelper(tasksSeed.tasks, user.id, Tasks);
    const projectId = 1;
    const tasks = await request(app)
      .get(`/api/v1/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    const { data, status } = tasks.body;
    expect(tasks.statusCode).toBe(200);
    expect(status).toBe('success');
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toEqual(tasks.body.length);
    data.forEach((element: any) => {
      expect(element.projectId).toBe(projectId);
    });
  });
  describe('Getting task by ID', () => {
    it('Get Task', async () => {
      await seedingHelper(tasksSeed.projects, user.id, Projects);
      await seedingHelper(tasksSeed.tasks, user.id, Tasks);
      const testTaskID = 2;
      const projects = await request(app)
        .get(`/api/v1/tasks/${testTaskID}`)
        .set('Authorization', `Bearer ${token}`);

      const { data, status } = projects.body;

      expect(projects.statusCode).toBe(200);
      expect(status).toBe('success');
      expect(data.taskId).toEqual(testTaskID);
    });
    it('Project ID does not exist', async () => {
      await seedingHelper(tasksSeed.projects, user.id, Projects);
      await seedingHelper(tasksSeed.tasks, user.id, Tasks);
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

  it('Update task data', async () => {
    await seedingHelper(tasksSeed.projects, user.id, Projects);
    await seedingHelper(tasksSeed.tasks, user.id, Tasks);
    const mockTaskId = 3;
    const updatedValue = {
      name: 'New Task name',
      projectId: 1,
      paused: false,
    };

    const tasks = await request(app)
      .patch(`/api/v1/tasks/${mockTaskId}`)
      .send(updatedValue)
      .set('Authorization', `Bearer ${token}`);

    const { data } = tasks.body;

    expect(tasks.status).toBe(200);
    expect(data.name).toBe(updatedValue.name);
  });
  it('Delete task', async () => {
    await seedingHelper(tasksSeed.projects, user.id, Projects);
    await seedingHelper(tasksSeed.tasks, user.id, Tasks);
    const mockTaskId = 3;

    const tasks = await request(app)
      .delete(`/api/v1/tasks/${mockTaskId}`)
      .set('Authorization', `Bearer ${token}`);
    const { message, status } = tasks.body;

    expect(tasks.status).toBe(200);
    expect(status).toBe('success');
    expect(message).toBe('Task 3 deleted.');
  });
  describe('Adding new task', () => {
    it('Successfully posting a new task', async () => {
      await seedingHelper(tasksSeed.projects, user.id, Projects);

      const newTask = new Tasks({
        name: 'Task 6',
        projectId: 1,
        description: 'This is a new test project',

        estimatedTime: '2023-10-06T01:41:27.971Z',
        priority: 'high',
      });

      const response = await request(app)
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
    });
    it('Adding a Task that already exists', async () => {
      try {
        await seedingHelper(tasksSeed.projects, user.id, Projects);
        await seedingHelper(tasksSeed.tasks, user.id, Tasks);
        const userProject = {
          name: 'Task 6',
          projectId: 2,
          description: 'This is a new test task',
          paused: true,
        };
        const project = new Projects(userProject);
        project.author = user.id;
        await project.save();
        const response = request(app)
          .post('/api/v1/tasks')
          .send({
            name: 'Task 6',
            projectId: 2,
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
      await seedingHelper(tasksSeed.projects, user.id, Projects);
      await seedingHelper(tasksSeed.tasks, user.id, Tasks);
      const projects = await request(app)
        .get('/api/v1/tasks?sort=name')
        .set('Authorization', `Bearer ${token}`);
      const { data, status } = projects.body;
      expect(projects.statusCode).toBe(200);
      expect(status).toBe('success');
      expect(data[0].name).toBe('Task 1');
      expect(data.length).toEqual(projects.body.length);
    });
    it('Select specific fields', async () => {
      await seedingHelper(tasksSeed.projects, user.id, Projects);
      await seedingHelper(tasksSeed.tasks, user.id, Tasks);
      const projects = await request(app)
        .get('/api/v1/tasks?fields=name,projectId')
        .set('Authorization', `Bearer ${token}`);
      const { data, status } = projects.body;
      expect(projects.statusCode).toBe(200);
      expect(data.length).toEqual(projects.body.length);
      expect(Object.keys(data[0])).toContain('name');
      expect(Object.keys(data[0])).toContain('projectId');
      expect(Object.keys(data[0])).not.toContain('description');
    });
    it('Pagination and limiting', async () => {
      await seedingHelper(tasksSeed.projects, user.id, Projects);
      await seedingHelper(tasksSeed.tasks, user.id, Tasks);
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
