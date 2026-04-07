import { usersDb } from './_db.js';

export const UserModel = {
  async create(user) { return usersDb.insert(user); },
  async findByEmail(email) { return usersDb.findOne({ email }); },
  async findById(id) { return usersDb.findOne({ _id: id }); },
  async list(filter = {}) { return usersDb.find(filter).sort({ name: 1 }); },
  async remove(id) { return usersDb.remove({ _id: id }, {}); }
};
