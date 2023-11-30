import { Task, Tasks } from '../models/taskModel';

interface IQuery {
  sort?: string;
  page?: number;
  limit?: number;
  fields?: string;
  search?: string;
}

export class ApiFeatures {
  // query: any;

  query: any;

  queryString: IQuery;
  constructor(query: any, queryString: IQuery) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj: any = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(
      (el: string) => delete queryObj[el as keyof typeof queryObj]
    );
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.query.find(JSON.parse(queryString));

    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort;
      this.query = this.query.sort(`${sortBy}`);
    } else {
      this.query = this.query.sort('-createAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('');
    }
    return this;
  }
  paginate() {
    const page = (this.queryString.page as number) * 1 || 1;
    const limit: number = (this.queryString.limit as number) * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
  search() {
    if (this.queryString.search) {
      const searchQuery = this.queryString.search;
      const searchRegex = new RegExp(searchQuery, 'i');
      this.query = this.query.or([
        { name: searchRegex },
        { authorId: searchRegex },
        { description: searchRegex },
      ]);
    } else {
      this.query = this.query.find();
    }
    return this;
  }
}
