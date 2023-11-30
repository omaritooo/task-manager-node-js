import mongoose from 'mongoose';
import { app } from './index';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

export const dbConnection = mongoose
  .connect(process.env.DATABASE_LOCAL as string)
  .then(async (con) => {
    const { DATABASE_LOCAL } = process.env;
  })
  .catch((err) => console.log(err));

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Testing on port ${port}`);
});
