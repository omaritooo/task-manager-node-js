import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const { DATABASE_LOCAL } = process.env;

const client = new MongoClient(DATABASE_LOCAL as string);
export const db = client.db();
