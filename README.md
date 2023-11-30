
# Task-Manager-Backend

The Node.js Task Manager is a robust project that draws inspiration from Notion and Clickup built using Node , Express.js, and TypeScript, designed to efficiently manage and track tasks within a collaborative environment. This task management system provides a scalable and flexible solution for teams or individuals to organize, prioritize, and monitor their tasks seamlessly.
## Badges

[![typescript](https://img.shields.io/badge/logo-typescript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/logo-express-green?logo=express)](https://expressjs.com/)
[![Jest](https://img.shields.io/badge/logo-jest-red?logo=jest)](https://jestjs.io/)
[![AGPL License](https://img.shields.io/badge/logo-mongoose-green?logo=mongoose)](http://www.gnu.org/licenses/agpl-3.0)
[![AGPL License](https://img.shields.io/badge/logo-mongodb-green?logo=mongodb)](http://www.gnu.org/licenses/agpl-3.0)


## Overview

The Node.js Agile Task Manager is a dynamic project designed to facilitate collaborative task management among multiple users, applying Agile concepts to enhance team productivity and project coordination. Built on Node.js, this task manager embraces the principles of agility, providing an intuitive platform for teams to seamlessly plan, execute, and monitor tasks within a shared project environment.

 It draws inspiration from prominent AGILE applications such as Jira, clickup and notion. It utilizes multiple layers of authentication and authorization to assure that roles are applied to each project and task. Thus, ensuring a hierarchy remains where each team member working on a project knows what to do, when to do it and where to do it.
## Features

- User Authentication: Secure user authentication ensures that each team member has a personalized account, allowing them to manage tasks associated with their role.

- Project Organization: Tasks are organized within projects, providing a structured way to categorize and manage work based on specific goals or initiatives.

- Task Creation and Assignment: Users can create new tasks, assign them to specific team members, set priorities, and establish due dates to keep projects on track.

- Task Filtering and Sorting: Users can filter and sort tasks based on various criteria such as priority, status, and due date, enabling efficient task management.

- Detailed Task Information: Each task includes comprehensive details, such as descriptions, priority levels, estimated time, and status updates, offering a comprehensive overview of ongoing work.

- Audit Trail: The system maintains an audit trail, recording key changes to tasks and projects, providing transparency and accountability within the team.

- RESTful API: The project exposes a RESTful API, allowing for easy integration with other systems and services.


## Tech Stack

* Node.js: Server-side JavaScript runtime
* Express.js: Web application framework for Node.js
* TypeScript: Superset of JavaScript with static typing
* MongoDB: NoSQL database for storing task and user data
* Jest: a javascript unit testing suite.
* JWT (JSON Web Tokens): Token-based authentication for enhanced security


## Installation

Install interview-task with npm

```bash
  cd task-manager-nodejs
  npm i
  npm run dev
  npx jest 
```
    
## Running Tests

To run tests, run the following command

```bash
    npx jest
```

